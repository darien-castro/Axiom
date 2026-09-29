class Canvas_API{
  m_baseURL;
  m_apiKey;
  constructor(baseURL, apiKey){
    this.m_baseURL = baseURL;
    this.m_apiKey = apiKey;
  }

  async GetRequest(apiCall){
     const endpoint = this.m_baseURL + apiCall;
        try{
          const response = await fetch(`${endpoint}`,{
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${this.m_apiKey}`
            }
          });
          if (!response.ok){
            throw new Error(`Response Error Status: ${response.status}`);
          }
          const result = await response.json();
          return result;
        }
        catch(error){
          throw error;
          }
    }

 
  async GetCourses(){
    const apiEndpoint = "/api/v1/courses";
    const result = await this.GetRequest(apiEndpoint);
    return result;
  };
  async GetUserInformation(){
   //
  };
  
  // nothing important here
  async GetCourseData(CourseID){
    const apiEndpoint = `/api/v1/courses/${CourseID}`
    const result = await this.GetRequest(apiEndpoint);
    return result;
  }; 

  // done
  async GetCourseGrades(){
    const apiEndpoint = `/api/v1/users/self/enrollments`
    const result = await this.GetRequest(apiEndpoint);
    return result;
  };

  // don't think this one works
  async GetCourseGrade(CourseID){
    const apiEndpoint = `/api/v1/courses/${CourseID}`
    const result = await this.GetRequest(apiEndpoint);
    return result;
  };
  async GetUserInformation() {
    const apiEndpoint = "/api/v1/users/self";
    const result = await this.GetRequest(apiEndpoint);
    return result;
  }

  async GetCourseAssignments(CourseID) {
    // Lists all assignments (the prompts/details) for the course
    const apiEndpoint = `/api/v1/courses/${CourseID}/assignments`;
    const result = await this.GetRequest(apiEndpoint);
    return result;
  }
  async GetCourseAssignment(CourseID, AssignmentID) {
    // Gets the details (due dates, points possible) for one specific assignment
    const apiEndpoint = `/api/v1/courses/${CourseID}/assignments/${AssignmentID}`;
    const result = await this.GetRequest(apiEndpoint);
    return result;
  }
  async GetCourseSubmissions(CourseID) {
    // Lists all of the student's submissions for this specific course in one batch
    const apiEndpoint = `/api/v1/courses/${CourseID}/students/submissions`;
    const result = await this.GetRequest(apiEndpoint);
    return result;
  }
  async GetSubmissionGrade(CourseID, AssignmentID) {
    // Gets the student's specific submission and grade for a single assignment
    // 'self' safely maps to the authenticated student
    const apiEndpoint = `/api/v1/courses/${CourseID}/assignments/${AssignmentID}/submissions/self`;
    const result = await this.GetRequest(apiEndpoint);
    return result;
  }
}

module.exports = Canvas_API;
