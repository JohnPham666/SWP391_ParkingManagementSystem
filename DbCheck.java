import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DbCheck {
    public static void main(String[] args) {
        String url = "jdbc:postgresql://localhost:5432/ParkingManagementSystem";
        String user = "postgres";
        String password = "12345";
        
        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {
            
            System.out.println("Incidents:");
            ResultSet rs = stmt.executeQuery("SELECT incident_id, incident_type, description, status, session_id, reported_by FROM incidentreport ORDER BY incident_id DESC LIMIT 5");
            while(rs.next()) {
                System.out.println("ID: " + rs.getInt("incident_id") + 
                                   ", Type: " + rs.getString("incident_type") +
                                   ", Status: " + rs.getString("status") + 
                                   ", Session: " + rs.getObject("session_id") + 
                                   ", Reporter: " + rs.getInt("reported_by"));
            }
            
            System.out.println("Users with buildings:");
            rs = stmt.executeQuery("SELECT user_id, buildingid FROM users ORDER BY user_id DESC LIMIT 10");
            while(rs.next()) {
                System.out.println("UserID: " + rs.getInt("user_id") + ", BuildingID: " + rs.getObject("buildingid"));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
