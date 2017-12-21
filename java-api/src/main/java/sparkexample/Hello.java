package sparkexample;

import java.util.concurrent.TimeUnit;

import static spark.Spark.*;

public class Hello {

    private static long start = System.currentTimeMillis();

    public static void main(String[] args) {
        port(8080);
        ipAddress("0.0.0.0");

        get("/", (req, res) -> {
            long millis = System.currentTimeMillis() - start;
            String uptime = String.format("%02d:%02d",
                                          TimeUnit.MILLISECONDS.toMinutes(millis),
                                          TimeUnit.MILLISECONDS.toSeconds(millis) -
                                          TimeUnit.MINUTES.toSeconds(TimeUnit.MILLISECONDS.toMinutes(millis)));
            return String.format("Hello, Spark! (up %s, %s)", uptime, System.getenv("BUILD_PROFILE"));
        });
    }

}
