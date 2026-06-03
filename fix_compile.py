import os
import re

base_path = r"c:\Users\khait\OneDrive\Desktop\parkingmanagementsystem\src\main\java\com\parking\management"

# 1. Fix ApiResponse.java
api_response_path = os.path.join(base_path, "common", "ApiResponse.java")
with open(api_response_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("return new ApiResponse<>(true, message, data);", "return new ApiResponse<U>(true, message, data);")
content = content.replace("return new ApiResponse<>(false, message, null);", "return new ApiResponse<U>(false, message, null);")

with open(api_response_path, "w", encoding="utf-8") as f:
    f.write(content)

# 2. Fix CustomUserDetailsService.java
user_detail_path = os.path.join(base_path, "security", "CustomUserDetailsService.java")
with open(user_detail_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("new ArrayList<>()", "new ArrayList<org.springframework.security.core.GrantedAuthority>()")

with open(user_detail_path, "w", encoding="utf-8") as f:
    f.write(content)

# 3. Fix SecurityConfig.java
sec_config_path = os.path.join(base_path, "config", "SecurityConfig.java")
with open(sec_config_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("http.cors(org.springframework.security.config.Customizer.withDefaults())", "http.cors(cors -> cors.disable())")

with open(sec_config_path, "w", encoding="utf-8") as f:
    f.write(content)

# 4. Fix Services and Controllers
module_path = os.path.join(base_path, "module")
for root, dirs, files in os.walk(module_path):
    for file in files:
        if file.endswith("Service.java"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # replace "class XService implements XService" with "class XService"
            content = re.sub(r'class\s+(\w+Service)\s+implements\s+\1\s*\{', r'class \1 {', content)
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
        
        elif file.endswith("Controller.java"):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
            
            content = content.replace("List.of()", "java.util.Collections.emptyList()")
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)

print("Fixes applied.")
