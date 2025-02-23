package routes

import (
	"github.com/Maheshkarri4444/Examify/controllers"
	"github.com/gin-gonic/gin"
)

func ExamRoutes(r *gin.Engine) {
	exam := r.Group("/exam")
	{
		exam.POST("/create-exam", controllers.GoogleLogin)
		exam.GET("/getallexams", controllers.GoogleCallback)
		exam.GET("/getexambyid", controllers.GoogleCallback)

	}

}
