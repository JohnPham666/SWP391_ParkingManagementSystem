package com.parking.management.module.payment;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/mock-payment")
@RequiredArgsConstructor
public class MockPaymentController {

    private final PaymentService paymentService;

    @GetMapping(value = "/{method}/{id}", produces = MediaType.TEXT_HTML_VALUE)
    public String getMockPaymentPage(@PathVariable String method, @PathVariable Integer id) {
        return "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "    <meta charset=\"UTF-8\">" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "    <title>Mock Payment Gateway</title>" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }" +
                "        .card { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 100%; }" +
                "        h2 { color: #111827; margin-bottom: 24px; }" +
                "        p { color: #6b7280; margin-bottom: 32px; }" +
                "        .btn { background-color: #3b82f6; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: 600; width: 100%; transition: background-color 0.2s; }" +
                "        .btn:hover { background-color: #2563eb; }" +
                "        .btn-success { background-color: #10b981; margin-top: 16px; display: none; padding: 12px 24px; border-radius: 8px; font-size: 16px; color: white; font-weight: 600; width: 100%; box-sizing: border-box; }" +
                "        .method-tag { display: inline-block; background: #e0f2fe; color: #0284c7; padding: 4px 12px; border-radius: 999px; font-size: 14px; font-weight: bold; margin-bottom: 16px; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"card\">" +
                "        <div class=\"method-tag\">" + method.toUpperCase().replace("-", " ") + "</div>" +
                "        <h2>Mock Payment Gateway</h2>" +
                "        <p>You are paying for Transaction ID: <strong>" + id + "</strong>. This is a simulated environment.</p>" +
                "        <button id=\"payBtn\" class=\"btn\" onclick=\"processPayment()\">Simulate Payment Success</button>" +
                "        <div id=\"successBtn\" class=\"btn-success\">Payment Successful! You can close this window.</div>" +
                "    </div>" +
                "    <script>" +
                "        function processPayment() {" +
                "            document.getElementById('payBtn').innerText = 'Processing...';" +
                "            document.getElementById('payBtn').disabled = true;" +
                "            " +
                "            fetch('/mock-payment/process/" + id + "', {" +
                "                method: 'POST'" +
                "            })" +
                "            .then(res => {" +
                "                if(res.ok) {" +
                "                    document.getElementById('payBtn').style.display = 'none';" +
                "                    document.getElementById('successBtn').style.display = 'block';" +
                "                } else {" +
                "                    alert('Failed to process mock payment.');" +
                "                    document.getElementById('payBtn').innerText = 'Try Again';" +
                "                    document.getElementById('payBtn').disabled = false;" +
                "                }" +
                "            })" +
                "            .catch(err => {" +
                "                alert('Error: ' + err);" +
                "                document.getElementById('payBtn').innerText = 'Try Again';" +
                "                document.getElementById('payBtn').disabled = false;" +
                "            });" +
                "        }" +
                "    </script>" +
                "</body>" +
                "</html>";
    }

    @PostMapping("/process/{id}")
    public ResponseEntity<?> processPaymentMock(@PathVariable Integer id) {
        PaymentStatusUpdateRequest req = new PaymentStatusUpdateRequest();
        req.setPaymentStatus(PaymentStatus.PAID);
        paymentService.updateStatus(id, req);
        return ResponseEntity.ok().build();
    }
}
