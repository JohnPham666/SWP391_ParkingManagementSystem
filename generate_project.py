import os
import shutil

base_dir = r"C:\Users\khait\OneDrive\Desktop\parkingmanagementsystem"
src_main_java = os.path.join(base_dir, "src", "main", "java")
base_pkg_dir = os.path.join(src_main_java, "com", "parking", "management")
base_pkg = "com.parking.management"

def create_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

# Remove old package
old_pkg_dir = os.path.join(src_main_java, "com", "group2")
if os.path.exists(old_pkg_dir):
    # shutil.rmtree(old_pkg_dir)
    print("Skipping deletion of old package to avoid permission errors.")

# 1. pom.xml
pom_xml = """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
	xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
	<modelVersion>4.0.0</modelVersion>
	<parent>
		<groupId>org.springframework.boot</groupId>
		<artifactId>spring-boot-starter-parent</artifactId>
		<version>3.2.4</version>
		<relativePath/>
	</parent>
	<groupId>com.parking</groupId>
	<artifactId>management</artifactId>
	<version>0.0.1-SNAPSHOT</version>
	<name>ParkingManagementSystem</name>
	<description>Parking Building Management System</description>

	<properties>
		<java.version>17</java.version>
	</properties>

	<dependencies>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-data-jpa</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-security</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-validation</artifactId>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-web</artifactId>
		</dependency>
		<dependency>
			<groupId>com.microsoft.sqlserver</groupId>
			<artifactId>mssql-jdbc</artifactId>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.projectlombok</groupId>
			<artifactId>lombok</artifactId>
			<optional>true</optional>
		</dependency>
		<dependency>
			<groupId>org.springdoc</groupId>
			<artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
			<version>2.3.0</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-api</artifactId>
			<version>0.12.5</version>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-impl</artifactId>
			<version>0.12.5</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>io.jsonwebtoken</groupId>
			<artifactId>jjwt-jackson</artifactId>
			<version>0.12.5</version>
			<scope>runtime</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.boot</groupId>
			<artifactId>spring-boot-starter-test</artifactId>
			<scope>test</scope>
		</dependency>
		<dependency>
			<groupId>org.springframework.security</groupId>
			<artifactId>spring-security-test</artifactId>
			<scope>test</scope>
		</dependency>
	</dependencies>

	<build>
		<plugins>
			<plugin>
				<groupId>org.springframework.boot</groupId>
				<artifactId>spring-boot-maven-plugin</artifactId>
				<configuration>
					<excludes>
						<exclude>
							<groupId>org.projectlombok</groupId>
							<artifactId>lombok</artifactId>
						</exclude>
					</excludes>
				</configuration>
			</plugin>
		</plugins>
	</build>
</project>"""
create_file(os.path.join(base_dir, "pom.xml"), pom_xml)

# 2. application.properties
app_props = """# Server
server.port=8080

# SQL Server
spring.datasource.url=jdbc:sqlserver://localhost:1433;databaseName=ParkingManagementSystem;encrypt=false
spring.datasource.username=${DB_USERNAME:sa}
spring.datasource.password=${DB_PASSWORD:password}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver

# JPA — ddl-auto=none vì DB đã có sẵn từ SQL script
spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.SQLServerDialect
spring.jpa.properties.hibernate.format_sql=true

# JWT
jwt.secret=${JWT_SECRET:very_secret_key_needs_to_be_long_enough_for_hs256_at_least_32_bytes_long}
jwt.expiration=86400000

# Swagger
springdoc.swagger-ui.path=/swagger-ui.html
springdoc.api-docs.path=/api-docs
"""
create_file(os.path.join(base_dir, "src", "main", "resources", "application.properties"), app_props)

# 3. Main Application Class
main_app = f"""package {base_pkg};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ParkingManagementApplication {{
    public static void main(String[] args) {{
        SpringApplication.run(ParkingManagementApplication.class, args);
    }}
}}
"""
create_file(os.path.join(base_pkg_dir, "ParkingManagementApplication.java"), main_app)

# 4. Common Files
common_dir = os.path.join(base_pkg_dir, "common")
api_resp = f"""package {base_pkg}.common;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {{
    private boolean success;
    private String message;
    private T data;

    public static <T> ApiResponse<T> success(String message, T data) {{
        return new ApiResponse<>(true, message, data);
    }}

    public static <T> ApiResponse<T> error(String message) {{
        return new ApiResponse<>(false, message, null);
    }}
}}
"""
create_file(os.path.join(common_dir, "ApiResponse.java"), api_resp)

not_found_exc = f"""package {base_pkg}.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(value = HttpStatus.NOT_FOUND)
public class ResourceNotFoundException extends RuntimeException {{
    public ResourceNotFoundException(String message) {{
        super(message);
    }}
}}
"""
create_file(os.path.join(common_dir, "ResourceNotFoundException.java"), not_found_exc)

global_exc = f"""package {base_pkg}.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {{

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFound(ResourceNotFoundException ex) {{
        return new ResponseEntity<>(ApiResponse.error(ex.getMessage()), HttpStatus.NOT_FOUND);
    }}

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {{
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return new ResponseEntity<>(ApiResponse.error(errors.toString()), HttpStatus.BAD_REQUEST);
    }}

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {{
        return new ResponseEntity<>(ApiResponse.error("Internal Server Error: " + ex.getMessage()), HttpStatus.INTERNAL_SERVER_ERROR);
    }}
}}
"""
create_file(os.path.join(common_dir, "GlobalExceptionHandler.java"), global_exc)

# 5. Security & Config Files
config_dir = os.path.join(base_pkg_dir, "config")
sec_dir = os.path.join(base_pkg_dir, "security")

swagger_config = f"""package {base_pkg}.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {{

    @Bean
    public OpenAPI customOpenAPI() {{
        return new OpenAPI()
                .info(new Info().title("Parking Management API").version("1.0"))
                .addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
                .components(new Components().addSecuritySchemes("bearerAuth",
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }}
}}
"""
create_file(os.path.join(config_dir, "SwaggerConfig.java"), swagger_config)

jwt_util = f"""package {base_pkg}.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {{
    @Value("${{jwt.secret}}")
    private String secret;

    @Value("${{jwt.expiration}}")
    private long expiration;

    private SecretKey getSigningKey() {{
        return Keys.hmacShaKeyFor(secret.getBytes());
    }}

    public String generateToken(String username) {{
        return Jwts.builder()
                .subject(username)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey())
                .compact();
    }}

    public String extractUsername(String token) {{
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getSubject();
    }}

    public boolean validateToken(String token, UserDetails userDetails) {{
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }}

    private boolean isTokenExpired(String token) {{
        return Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload().getExpiration().before(new Date());
    }}
}}
"""
create_file(os.path.join(sec_dir, "JwtUtil.java"), jwt_util)

jwt_auth_filter = f"""package {base_pkg}.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {{

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {{
        
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {{
            filterChain.doFilter(request, response);
            return;
        }}

        jwt = authHeader.substring(7);
        try {{
            username = jwtUtil.extractUsername(jwt);
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {{
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                if (jwtUtil.validateToken(jwt, userDetails)) {{
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }}
            }}
        }} catch (Exception e) {{
            // JWT validation failed
        }}
        filterChain.doFilter(request, response);
    }}
}}
"""
create_file(os.path.join(sec_dir, "JwtAuthFilter.java"), jwt_auth_filter)

custom_user_details = f"""package {base_pkg}.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
public class CustomUserDetailsService implements UserDetailsService {{
    // TODO: Inject UserRepository to load user from database
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {{
        // Basic placeholder implementation. Needs to be wired with UserRepository in actual app.
        if ("admin".equals(username)) {{
            return new User("admin", "password", new ArrayList<>());
        }}
        throw new UsernameNotFoundException("User not found with username: " + username);
    }}
}}
"""
create_file(os.path.join(sec_dir, "CustomUserDetailsService.java"), custom_user_details)

security_config = f"""package {base_pkg}.config;

import {base_pkg}.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {{

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {{
        http.csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }}

    @Bean
    public PasswordEncoder passwordEncoder() {{
        return new BCryptPasswordEncoder();
    }}

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {{
        return config.getAuthenticationManager();
    }}
}}
"""
create_file(os.path.join(config_dir, "SecurityConfig.java"), security_config)

# 6. Modules setup
modules = {
    "auth": {
        "entities": [],
        "enums": [],
        "dtos": ["LoginRequest", "JwtResponse"],
        "has_crud": False
    },
    "user": {
        "entities": ["User", "Role"],
        "enums": ["RoleName"],
        "dtos": ["UserRequest", "UserResponse"],
        "has_crud": True,
        "main_entity": "User"
    },
    "vehicle": {
        "entities": ["Vehicle", "VehicleType"],
        "enums": [],
        "dtos": ["VehicleRequest", "VehicleResponse"],
        "has_crud": True,
        "main_entity": "Vehicle"
    },
    "building": {
        "entities": ["Building"],
        "enums": [],
        "dtos": ["BuildingRequest", "BuildingResponse"],
        "has_crud": True,
        "main_entity": "Building"
    },
    "floor": {
        "entities": ["Floor"],
        "enums": [],
        "dtos": ["FloorRequest", "FloorResponse"],
        "has_crud": True,
        "main_entity": "Floor"
    },
    "zone": {
        "entities": ["Zone"],
        "enums": [],
        "dtos": ["ZoneRequest", "ZoneResponse"],
        "has_crud": True,
        "main_entity": "Zone"
    },
    "slot": {
        "entities": ["ParkingSlot"],
        "enums": ["SlotStatus"],
        "dtos": ["SlotRequest", "SlotResponse"],
        "has_crud": True,
        "main_entity": "ParkingSlot"
    },
    "pricing": {
        "entities": ["PricingPolicy"],
        "enums": [],
        "dtos": ["PricingRequest", "PricingResponse"],
        "has_crud": True,
        "main_entity": "PricingPolicy"
    },
    "session": {
        "entities": ["ParkingSession"],
        "enums": ["SessionStatus"],
        "dtos": ["SessionRequest", "SessionResponse"],
        "has_crud": True,
        "main_entity": "ParkingSession"
    },
    "payment": {
        "entities": ["Payment"],
        "enums": ["PaymentMethod", "PaymentStatus"],
        "dtos": ["PaymentRequest", "PaymentResponse"],
        "has_crud": True,
        "main_entity": "Payment"
    },
    "reservation": {
        "entities": ["Reservation"],
        "enums": ["ReservationStatus"],
        "dtos": ["ReservationRequest", "ReservationResponse"],
        "has_crud": True,
        "main_entity": "Reservation"
    },
    "incident": {
        "entities": ["IncidentReport"],
        "enums": ["IncidentType", "IncidentStatus"],
        "dtos": ["IncidentRequest", "IncidentResponse"],
        "has_crud": True,
        "main_entity": "IncidentReport"
    }
}

def generate_entity(mod_name, entity_name):
    return f"""package {base_pkg}.module.{mod_name};

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "{entity_name.lower()}s")
public class {entity_name} {{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // TODO: Add actual fields mapped to the SQL Schema here
}}
"""

def generate_enum(mod_name, enum_name):
    # Hardcode specified enum values
    values = "VALUE1, VALUE2"
    if enum_name == "RoleName": values = "ADMIN, PARKING_MANAGER, PARKING_STAFF, DRIVER"
    elif enum_name == "SlotStatus": values = "AVAILABLE, OCCUPIED, RESERVED, LOCKED"
    elif enum_name == "SessionStatus": values = "PARKING, COMPLETED, LOST_TICKET, UNPAID, VIOLATION"
    elif enum_name == "PaymentMethod": values = "CASH, BANK_TRANSFER, E_WALLET, CREDIT_CARD"
    elif enum_name == "PaymentStatus": values = "PENDING, PAID, FAILED"
    elif enum_name == "ReservationStatus": values = "PENDING, CONFIRMED, CANCELLED, EXPIRED"
    elif enum_name == "IncidentType": values = "LOST_TICKET, WRONG_LICENSE_PLATE, OVERTIME, WRONG_ZONE, UNPAID, SLOT_OCCUPIED, FACILITY_DAMAGE, OTHER"
    elif enum_name == "IncidentStatus": values = "OPEN, IN_PROGRESS, RESOLVED, CLOSED"

    return f"""package {base_pkg}.module.{mod_name};

public enum {enum_name} {{
    {values}
}}
"""

def generate_dto(mod_name, dto_name, is_req):
    req_imports = "import jakarta.validation.constraints.NotNull;\nimport jakarta.validation.constraints.Size;\n" if is_req else ""
    fields = """    @NotNull
    private String name; // TODO: Adjust fields""" if is_req else "    private Long id;\n    private String name;"
    return f"""package {base_pkg}.module.{mod_name};

import lombok.Data;
{req_imports}
@Data
public class {dto_name} {{
{fields}
}}
"""

def generate_repo(mod_name, entity_name):
    return f"""package {base_pkg}.module.{mod_name};

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface {entity_name}Repository extends JpaRepository<{entity_name}, Long> {{
    // Custom query 1
    // List<{entity_name}> findBySomeField(String field);
}}
"""

def generate_service(mod_name, entity_name):
    prefix = entity_name.replace("Parking", "").replace("IncidentReport", "Incident").replace("PricingPolicy", "Pricing")
    return f"""package {base_pkg}.module.{mod_name};

import java.util.List;

public interface {prefix}Service {{
    {prefix}Response create({prefix}Request request);
    {prefix}Response update(Long id, {prefix}Request request);
    {prefix}Response getById(Long id);
    List<{prefix}Response> getAll();
    void delete(Long id);
}}
"""

def generate_service_impl(mod_name, entity_name):
    prefix = entity_name.replace("Parking", "").replace("IncidentReport", "Incident").replace("PricingPolicy", "Pricing")
    return f"""package {base_pkg}.module.{mod_name};

import {base_pkg}.common.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class {prefix}Service /* implements {prefix}Service */ {{
    // private final {entity_name}Repository repository;

    // public {prefix}Response create({prefix}Request request) {{ ... }}
}}
"""

def generate_controller(mod_name, entity_name):
    prefix = entity_name.replace("Parking", "").replace("IncidentReport", "Incident").replace("PricingPolicy", "Pricing")
    return f"""package {base_pkg}.module.{mod_name};

import {base_pkg}.common.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/{mod_name}s")
@RequiredArgsConstructor
public class {prefix}Controller {{
    
    // private final {prefix}Service service;

    @PostMapping
    public ApiResponse<{prefix}Response> create(@Valid @RequestBody {prefix}Request request) {{
        return ApiResponse.success("Created successfully", new {prefix}Response());
    }}

    @GetMapping("/{{id}}")
    public ApiResponse<{prefix}Response> getById(@PathVariable Long id) {{
        return ApiResponse.success("Fetched successfully", new {prefix}Response());
    }}

    @GetMapping
    public ApiResponse<List<{prefix}Response>> getAll() {{
        return ApiResponse.success("Fetched all successfully", List.of());
    }}

    @PutMapping("/{{id}}")
    public ApiResponse<{prefix}Response> update(@PathVariable Long id, @Valid @RequestBody {prefix}Request request) {{
        return ApiResponse.success("Updated successfully", new {prefix}Response());
    }}

    @DeleteMapping("/{{id}}")
    public ApiResponse<Void> delete(@PathVariable Long id) {{
        return ApiResponse.success("Deleted successfully", null);
    }}
}}
"""

for mod, data in modules.items():
    mod_dir = os.path.join(base_pkg_dir, "module", mod)
    
    for e in data["entities"]:
        create_file(os.path.join(mod_dir, f"{e}.java"), generate_entity(mod, e))
        if data["has_crud"] and e == data["main_entity"]:
            create_file(os.path.join(mod_dir, f"{e}Repository.java"), generate_repo(mod, e))
            
    # For VehicleTypeRepo if needed specifically
    if mod == "vehicle":
        create_file(os.path.join(mod_dir, "VehicleTypeRepository.java"), generate_repo(mod, "VehicleType"))

    for e in data["enums"]:
        create_file(os.path.join(mod_dir, f"{e}.java"), generate_enum(mod, e))
        
    for d in data["dtos"]:
        is_req = "Request" in d
        create_file(os.path.join(mod_dir, f"{d}.java"), generate_dto(mod, d, is_req))
        
    if data["has_crud"]:
        e_main = data["main_entity"]
        prefix = e_main.replace("Parking", "").replace("IncidentReport", "Incident").replace("PricingPolicy", "Pricing")
        create_file(os.path.join(mod_dir, f"{prefix}Service.java"), generate_service(mod, e_main))
        create_file(os.path.join(mod_dir, f"{prefix}Service.java"), generate_service_impl(mod, e_main).replace("/* implements", "implements").replace("*/", ""))
        create_file(os.path.join(mod_dir, f"{prefix}Controller.java"), generate_controller(mod, e_main))

# Auth module specific
auth_dir = os.path.join(base_pkg_dir, "module", "auth")
auth_ctrl = f"""package {base_pkg}.module.auth;

import {base_pkg}.common.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {{

    @PostMapping("/login")
    public ApiResponse<JwtResponse> login(@Valid @RequestBody LoginRequest request) {{
        // Implementation here
        return ApiResponse.success("Login successful", new JwtResponse());
    }}
}}
"""
create_file(os.path.join(auth_dir, "AuthController.java"), auth_ctrl)
create_file(os.path.join(auth_dir, "AuthService.java"), f"package {base_pkg}.module.auth;\n\npublic interface AuthService {{}}")

# Report module specific
report_dir = os.path.join(base_pkg_dir, "module", "report")
report_dto_dir = os.path.join(report_dir, "dto")

create_file(os.path.join(report_dto_dir, "RevenueReportResponse.java"), f"package {base_pkg}.module.report.dto;\n\npublic class RevenueReportResponse {{}}")
create_file(os.path.join(report_dto_dir, "OccupancyReportResponse.java"), f"package {base_pkg}.module.report.dto;\n\npublic class OccupancyReportResponse {{}}")
create_file(os.path.join(report_dto_dir, "SessionSummaryResponse.java"), f"package {base_pkg}.module.report.dto;\n\npublic class SessionSummaryResponse {{}}")

report_service = f"""package {base_pkg}.module.report;

import {base_pkg}.module.report.dto.*;
import java.time.LocalDate;

public interface ReportService {{
    RevenueReportResponse getTotalRevenueByDateRange(LocalDate from, LocalDate to);
    OccupancyReportResponse getOccupancyRateByFloor(Integer floorId);
    SessionSummaryResponse getSessionCountByDate(LocalDate date);
}}
"""
create_file(os.path.join(report_dir, "ReportService.java"), report_service)
create_file(os.path.join(report_dir, "ReportController.java"), f"package {base_pkg}.module.report;\n\nimport org.springframework.web.bind.annotation.RestController;\n\n@RestController\npublic class ReportController {{}}")

# 7. README.md
readme = """# Parking Building Management System

## Prerequisites
- Java 17
- Maven
- Microsoft SQL Server

## Setup Instructions

1. **Clone the repository**
2. **Run SQL script**: 
   - Execute the SQL schema script in your local SQL Server instance to create `ParkingManagementSystem` database and tables.
3. **Set Environment Variables**:
   - `DB_USERNAME`: Your SQL Server username (e.g. `sa`)
   - `DB_PASSWORD`: Your SQL Server password
   - `JWT_SECRET`: A secure random string for JWT generation
4. **Run the Application**:
   ```bash
   mvn spring-boot:run
   ```

## API Access
- Base URL: `http://localhost:8080/api`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Team Branching Strategy
- `main` branch is for stable releases.
- Create feature branches for each member: `feature/member1`, `feature/member2`, etc.
- Member 1: Auth, User, Vehicle
- Member 2: Building, Floor, Zone, Slot
- Member 3: Session, Payment, Reservation
- Member 4: Pricing, Incident, Report
"""
create_file(os.path.join(base_dir, "README.md"), readme)

print("Project generation complete!")
