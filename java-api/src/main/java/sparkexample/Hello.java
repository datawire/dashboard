package sparkexample;

import java.util.concurrent.TimeUnit;

import static spark.Spark.*;

public class Hello {

    private static long start = System.currentTimeMillis();

    public static void main(String[] args) {
        port(8080);
        ipAddress("0.0.0.0");

        get("/", (req, res) -> {
            long elapsed = System.currentTimeMillis() - start;
            String uptime = String.format("%d:%d:%d",
                                          TimeUnit.MILLISECONDS.toHours(elapsed),
                                          TimeUnit.MILLISECONDS.toMinutes(elapsed),
                                          TimeUnit.MILLISECONDS.toSeconds(elapsed));
            return String.format("Hello, Spark! (up %s, %s)", uptime, System.getenv("BUILD_PROFILE"));
        });
    }

}
