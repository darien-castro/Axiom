from unittest.mock import patch
from urllib.error import HTTPError
from django.test import SimpleTestCase, override_settings


@override_settings(ALLOWED_HOSTS=['testserver'], CANVAS_B_THRESHOLD=83,
                   CANVAS_TIMEZONE='America/New_York', API_ALLOWED_ORIGINS=['http://localhost:3000'])
class AssignmentApiTests(SimpleTestCase):
    def fake_list(self, path, params=None):
        if path == '/courses':
            return [{'id': 1, 'name': 'Math', 'apply_assignment_group_weights': True,
                     'enrollments': [{'type': 'student', 'computed_current_score': 79}]}]
        if path == '/users/self/todo':
            return [{'assignment': {'id': 1, 'course_id': 1}}]
        if path.endswith('/assignment_groups'):
            return [{'id': 10, 'name': 'Homework', 'group_weight': 30}]
        return [dict(id=i, name=f'Task {i}', assignment_group_id=10,
                     due_at=due, lock_at=lock, html_url=f'https://example.com/assignments/{i}',
                     submission={'workflow_state': state}) for i, due, lock, state in [
            (1, '2026-11-09T01:00:00Z', '2026-11-10T01:00:00Z', 'unsubmitted'),
            (2, None, '2026-11-08T15:00:00Z', 'unsubmitted'),
            (3, None, None, 'unsubmitted'),
            (4, None, None, 'submitted'),
            (5, '2026-11-10T15:00:00Z', None, 'unsubmitted'),
        ]]

    def test_requires_token_and_get(self):
        with patch('api.views.CanvasClient.list') as fetch:
            self.assertEqual(self.client.get('/api/assignments/').status_code, 401)
            self.assertEqual(self.client.post('/api/assignments/').status_code, 405)
            fetch.assert_not_called()

    @patch('api.views.CanvasClient.list')
    def test_weekly_json_selection_timezone_and_alert(self, fetch):
        fetch.side_effect = self.fake_list
        response = self.client.get('/api/assignments/weekly/', HTTP_AUTHORIZATION='Bearer test')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['count'], 3)
        self.assertEqual(data['weeks'][0]['week_start'], '2026-11-02')
        items = data['weeks'][0]['courses'][0]['assignments']
        self.assertEqual({x['assignment_id'] for x in items}, {1, 2})
        fallback = next(x for x in items if x['assignment_id'] == 2)
        self.assertIsNone(fallback['due_at'])
        self.assertEqual(fallback['effective_due_at'], fallback['lock_at'])
        self.assertEqual(fallback['date_source'], 'lock_at')
        self.assertEqual(fallback['group_weight'], 30)
        self.assertEqual(fallback['alert']['symbol'], '!')
        self.assertIsNone(data['weeks'][-1]['week_start'])
        self.assertEqual(response['Cache-Control'], 'no-store')

    @patch('api.views.CanvasClient.list')
    def test_other_routes(self, fetch):
        fetch.side_effect = self.fake_list
        for path, key in [('courses/', 'courses'), ('todo/', 'items'),
                          ('courses/1/assignment-groups/', 'groups'), ('assignments/', 'assignments')]:
            response = self.client.get('/api/' + path, HTTP_AUTHORIZATION='Bearer test')
            self.assertEqual(response.status_code, 200)
            self.assertIn(key, response.json())

    @patch('api.views.CanvasClient.list')
    def test_errors_do_not_echo_tokens(self, fetch):
        fetch.side_effect = HTTPError('https://canvas.example.com', 403, 'private detail', {}, None)
        response = self.client.get('/api/courses/', HTTP_AUTHORIZATION='Bearer secret')
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json(), {'error': 'canvas_request_failed', 'upstream_status': 403})

    def test_browser_preflight(self):
        response = self.client.options('/api/assignments/', HTTP_ORIGIN='http://localhost:3000')
        self.assertEqual(response.status_code, 204)
        self.assertEqual(response['Access-Control-Allow-Origin'], 'http://localhost:3000')
        response = self.client.options('/api/assignments/', HTTP_ORIGIN='https://untrusted.example')
        self.assertNotIn('Access-Control-Allow-Origin', response)
