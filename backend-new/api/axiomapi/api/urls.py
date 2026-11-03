from django.urls import path
from . import views

urlpatterns = [
    path('courses/', views.courses),
    path('todo/', views.todo),
    path('courses/<int:course_id>/assignment-groups/', views.assignment_groups),
    path('assignments/', views.assignments),
    path('assignments/weekly/', views.weekly_assignments),
]
