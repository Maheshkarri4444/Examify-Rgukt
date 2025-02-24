package routes

import (
	"github.com/Maheshkarri4444/Examify/controllers"
	"github.com/Maheshkarri4444/Examify/middleware"
	"github.com/gin-gonic/gin"
)

func ExamRoutes(r *gin.Engine) {
	exam := r.Group("/exam")
	{
		exam.POST("/create-exam", middleware.TeacherMiddleware(), controllers.CreateExam)
		exam.PUT("/update-exam", middleware.TeacherMiddleware(), controllers.UpdateExam)

		exam.GET("/getallexams", controllers.GetAllExams)
		exam.GET("/getexambyid", controllers.GetExamById)

	}

}
