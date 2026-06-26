public class CheckTimezone {
    public static void main(String[] args) {
        System.out.println("Timezone: " + java.util.TimeZone.getDefault().getID());
        System.out.println("Date: " + new java.text.SimpleDateFormat("yyyyMMddHHmmss").format(new java.util.Date()));
    }
}
