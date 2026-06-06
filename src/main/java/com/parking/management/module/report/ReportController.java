package com.parking.management.module.report;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RestController;

@RestController
@PreAuthorize("hasAnyRole('Admin', 'ParkingManager')")
@RequestMapping("/api/reports")
@Tag(name = "Report", description = "APIs for revenue reports, occupancy reports and parking predictions")
public class ReportController {}
