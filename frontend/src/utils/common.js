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
  updateExam: {
    url: `${backapi}/exam/update-exam`,
    method: "PUT",
  },
  getExams: {
    url: `${backapi}/exam/getexamsbycontainer`,
    method: "GET",
  },
  getExamById: {
    url: (id) => `${backapi}/exam/getexambyid?id=${id}`,
    method: "GET",
  },
  getAllExams: {
    url: `${backapi}/exam/getallexams`,
    method: "GET",
  },
  createSets: {
    url: `${backapi}/exam/exam/create-sets`,
    method: "POST",
  },
  getQuestionPaper: {
    url: (id) => `${backapi}/exam/qpaper/${id}`,
    method: "GET",
  },
  backapi
};

export default Allapi;