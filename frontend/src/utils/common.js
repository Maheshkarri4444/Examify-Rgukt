const backapi = "http://localhost:8080";

const Allapi = {
  googleLogin: {
    url: `${backapi}/auth/google`,
    method: "GET",
  },
  googleCallback: {
    url: `${backapi}/auth/googlecallback`,
    method: "GET",
  },
  createExam: {
    url: `${backapi}/exam/create-exam`,
    method: "POST",
  },
  getExams: {
    url: `${backapi}/exam/getexamsbycontainer`,
    method: "GET",
  },
  getExamById: {
    url: (id) => `${backapi}/exam/getexambyid?id=${id}`,
    method: "GET",
  },
  updateExam: {
    url: `${backapi}/exam/update-exam`,
    method: "PUT",
  }
};

export default Allapi;