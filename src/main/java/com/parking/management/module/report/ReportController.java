package com.parking.management.module.report;

import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@Tag(name = "Report", description = "APIs for revenue reports, occupancy reports and parking predictions")
public class ReportController {}
