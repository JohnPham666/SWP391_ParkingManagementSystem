public class TimezoneCheck {
    public static void main(String[] args) {
        System.out.println("JVM Default Timezone: " + java.util.TimeZone.getDefault().getID());
        System.out.println("Current Date String (SimpleDateFormat without timezone): " + new java.text.SimpleDateFormat("yyyyMMddHHmmss").format(new java.util.Date()));
        
        java.text.SimpleDateFormat sdf = new java.text.SimpleDateFormat("yyyyMMddHHmmss");
        sdf.setTimeZone(java.util.TimeZone.getTimeZone("Asia/Ho_Chi_Minh"));
        System.out.println("VNPay Expected Date String (Asia/Ho_Chi_Minh): " + sdf.format(new java.util.Date()));
    }
}
