package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/Maheshkarri4444/Examify/config"
	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

var userCollection *mongo.Collection = config.GetCollection(config.Client, "users")

func VerifyJWT(tokenString string) (jwt.MapClaims, error) {
	token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
		return []byte(os.Getenv("JWT_SECRET")), nil
	})

	if err != nil || !token.Valid {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, err
	}

	return claims, nil
}

func AuthMiddleware(requiredRole string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token required"})
			c.Abort()
			return
		}

		claims, err := VerifyJWT(tokenString)
		if err != nil {
			fmt.Println("err: ", err)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		email, ok := claims["email"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email in token"})
			c.Abort()
			return
		}

		// Fetch user from the database using email
		var user struct {
			ID          primitive.ObjectID `bson:"_id"`
			Role        string             `bson:"role"`
			ContainerID primitive.ObjectID `bson:"contianer_id"`
		}

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		err = userCollection.FindOne(ctx, bson.M{"email": email}).Decode(&user)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}
		fmt.Println("user: ", user)
		// Check if user has the required role
		if user.Role != requiredRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			c.Abort()
			return
		}

		// Set user ID and role in context
		c.Set("user_id", user.ID)
		c.Set("role", user.Role)
		c.Set("container_id", user.ContainerID)
		c.Next()
	}
}
func StudentMiddleware() gin.HandlerFunc {
	return AuthMiddleware("student")
}

func TeacherMiddleware() gin.HandlerFunc {
	return AuthMiddleware("teacher")
}
