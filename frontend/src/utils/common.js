const backapi = "http://localhost:8080";

const Allapi = {
  googleLogin: {
    url: `${backapi}/auth/google`,
    method: "GET",
  },
  googleCallback: {
    url: `${backapi}/auth/googlecallback`,
    method: "GET",
  }
};

export default Allapi;