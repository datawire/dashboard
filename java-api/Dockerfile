FROM openjdk:8-jdk-slim
WORKDIR /code
COPY . ./
RUN ./gradlew package
ENTRYPOINT ["java", "-jar", "build/libs/hello-spark.jar"]
