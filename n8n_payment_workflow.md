# Setting up the Payment Notification Workflow in n8n

1. Create a new workflow in n8n and name it "Payment Notification Handler"

2. Add a Webhook node:
   - Click the '+' button and search for "Webhook"
   - Select "Webhook" under "Trigger" category
   - Configure the webhook:
     - Authentication: None
     - HTTP Method: POST
     - Path: payment-notification
     - Response Mode: Last Node

3. Add an HTTP Request node:
   - Click '+' after the Webhook node
   - Search for "HTTP Request"
   - Configure the node:
     - HTTP Method: POST
     - URL: https://your-replit-domain/api/webhooks/n8n/payment-notification
     - Headers: Content-Type: application/json
     - Request Body:
     ```json
     {
       "userId": "={{$json.userId}}",
       "paymentStatus": "={{$json.paymentStatus}}",
       "amount": "={{$json.amount}}",
       "customerEmail": "={{$json.customerEmail}}"
     }
     ```

4. Test the workflow:
   - Click "Execute Workflow" with test data:
   ```json
   {
     "userId": "test-user-123",
     "paymentStatus": "succeeded",
     "amount": 5999,
     "customerEmail": "test@example.com"
   }
   ```

5. Activate the workflow:
   - Click the "Active" toggle in the top-right corner
   - Save the workflow

Your webhook URL will be: https://your-n8n-domain/webhook/payment-notification
