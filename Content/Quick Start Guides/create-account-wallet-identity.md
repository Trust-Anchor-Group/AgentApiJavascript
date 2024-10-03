Thank you for pointing that out! I apologize for the oversight. I'll update the tutorial to reflect the correct hierarchy of function calls based on the structure you've provided. The function calls will now use the correct namespaces, such as `agentApi.Account.CreateAccount`.

---

# **Quick Start Guide: Creating an Account, Wallet, and Digital Identity Using the Agent API (JavaScript Implementation)**

This guide will help you set up an account, create a wallet, and apply for a digital identity using the Agent API with JavaScript.

---

## **Overview**

With the Agent API JavaScript implementation, you can:

- **Create an Account** on a Neuron® network effortlessly.
- **Set Up a Wallet** for transactions.
- **Apply for a Digital Identity** securely.

---

## **Prerequisites**

- **Agent API JavaScript Library:** Ensure you have access to the Agent API JavaScript library from the repository: [AgentApiJavascript](https://github.com/Trust-Anchor-Group/AgentApiJavascript/blob/main/Root/Agent.js).
- **API Key and Secret:** Obtain these from your operator.
- **Neuron® Domain:** The domain (host) of the Neuron® where API calls are made.
- **Node.js Environment:** For running JavaScript code.

---

## **Step-by-Step Guide**

### **Step 1: Initialize the Agent API and Set the Host**

First, integrate the Agent API JavaScript library into your project.

**Installation:**

If the library is available via npm, you can install it:

```bash
npm install agent-api-js
```

Or, clone the repository and include the `Agent.js` file in your project.

**Initialization and Setting the Host:**

```javascript
const AgentApi = require('./Agent'); // Adjust the path as necessary

const agentApi = AgentAPI; // Using the global AgentAPI object from the script

// Set the host (Neuron® domain) where API calls are made
agentApi.IO.SetHost('YOUR_NEURON_DOMAIN');
```

**Important:**

- Replace `'YOUR_NEURON_DOMAIN'` with the domain of the Neuron® you are connecting to.

**Example:**

```javascript
agentApi.IO.SetHost('neuron.example.com'); // Set the Neuron® domain
```

---

### **Step 2: Create an Account**

**Method:** Use the `Create` function under the `Account` namespace.

**Requirements:**

- **Username and Password**
- **Email Address**
- **API Key and Secret:** Provided by your operator.
- **Session Duration (Seconds):** Duration for which the session token is valid.

**Process:**

```javascript
const userName = 'yourUsername';
const password = 'yourPassword';
const email = 'yourEmail@example.com';
const apiKey = 'YOUR_API_KEY';       // Provided by your operator
const apiSecret = 'YOUR_API_SECRET'; // Provided by your operator
const sessionDuration = 3600;        // Session duration in seconds (e.g., 1 hour)

agentApi.Account.Create(userName, email, password, apiKey, apiSecret, sessionDuration)
  .then(response => {
    console.log('Account created successfully:', response);
  })
  .catch(error => {
    console.error('Error creating account:', error);
  });
```

**Note:**

- **Nonce:** The JavaScript library automatically handles nonce values, so you don't need to provide them.
- **Domain:** The domain is set using `SetHost` and is used for all API calls.

---

### **Step 3: Verify Your Email Address**

To activate your account:

1. **Check Your Email:**

   - Look for a verification email containing a code.

2. **Verify:**

   ```javascript
   const verificationCode = 'VERIFICATION_CODE_FROM_EMAIL';

   agentApi.Account.VerifyEMail(email, verificationCode)
     .then(response => {
       console.log('Email verified successfully:', response);
     })
     .catch(error => {
       console.error('Error verifying email:', error);
     });
   ```

**Important:** Replace `'VERIFICATION_CODE_FROM_EMAIL'` with the actual code you received.

---

### **Step 4: Manage Your Session**

**Session Handling:**

- The JavaScript API manages session tokens automatically.
- Tokens are refreshed as needed without manual intervention.

**Logging In Later:**

If you need to log in again:

```javascript
const sessionDuration = 3600; // Session duration in seconds

agentApi.Account.Login(userName, password, sessionDuration)
  .then(response => {
    console.log('Logged in successfully:', response);
  })
  .catch(error => {
    console.error('Error logging in:', error);
  });
```

---

### **Step 5: Create a Cryptographic Key**

Cryptographic keys are essential for secure transactions and digital signatures.

**How to Create a Key:**

1. **Get Supported Algorithms:**

   ```javascript
   agentApi.Crypto.GetAlgorithms()
     .then(algorithms => {
       console.log('Supported algorithms:', algorithms);
       // Choose an algorithm, e.g., algorithms[0].Name
       const chosenAlgorithm = algorithms[0].Name;

       // Proceed to create a key with the chosen algorithm
       createKey(chosenAlgorithm);
     })
     .catch(error => {
       console.error('Error fetching algorithms:', error);
     });

   function createKey(chosenAlgorithm) {
     // Proceed to Step 2
   }
   ```

2. **Create Key:**

   ```javascript
   const keyId = 'yourKeyId';             // Your identifier for the key
   const keyPassword = 'yourKeyPassword'; // Secure password for the key

   agentApi.Crypto.CreateKey('localName', 'namespace', keyId, keyPassword, password)
     .then(response => {
       console.log('Key created successfully:', response);
     })
     .catch(error => {
       console.error('Error creating key:', error);
     });
   ```

   - **Parameters:**
     - `'localName'` and `'namespace'` can be arbitrary strings used to identify the key context.

3. **Save Your Key Information:**

   - **Important:** You'll need the **keyId** and **keyPassword** in the next step. Store them securely.

**Security Tip:** Keep your key password confidential; it's required for signing transactions.

---

### **Step 6: Apply for a Legal Identity**

A legal identity links your personal information to your account securely.

**Before You Begin:**

- **Check Required Identity Properties:**

  ```javascript
  agentApi.Legal.GetApplicationAttributes()
    .then(attributes => {
      console.log('Required identity properties:', attributes);
      // Prepare your personal details based on these attributes
      applyForIdentity(attributes);
    })
    .catch(error => {
      console.error('Error fetching application attributes:', error);
    });

  function applyForIdentity(attributes) {
    // Proceed to the next step
  }
  ```

**Process:**

1. **Initiate Application:**

   ```javascript
   const personalDetails = {
     // Provide the required identity properties here
     FirstName: 'YourFirstName',
     LastName: 'YourLastName',
     // ... other required properties based on attributes
   };

   agentApi.Legal.ApplyId('localName', 'namespace', keyId, keyPassword, password, personalDetails)
     .then(response => {
       console.log('Identity application initiated:', response);
       const identityId = response.data.id; // Save this ID for monitoring status
     })
     .catch(error => {
       console.error('Error applying for identity:', error);
     });
   ```

2. **Add Attachments (If Required):**

   - **Note:** This step is only necessary if the Neuron® requires attachments like photos.

   ```javascript
   // Only proceed if attachments are required
   const attachment = base64EncodedData; // The file data encoded in base64
   const fileName = 'photo.jpg';
   const contentType = 'image/jpeg';
   const legalId = 'yourLegalId'; // From the response of ApplyId

   agentApi.Legal.AddIdAttachment('localName', 'namespace', keyId, keyPassword, password, legalId, attachment, fileName, contentType)
     .then(response => {
       console.log('Attachment added successfully:', response);
     })
     .catch(error => {
       console.error('Error adding attachment:', error);
     });
   ```

3. **Submit for Approval (Only If Attachments Were Added):**

   - **Note:** If you added attachments, you need to call `ReadyForApproval`.

   ```javascript
   // Only necessary if attachments were added
   agentApi.Legal.ReadyForApproval(legalId)
     .then(response => {
       console.log('Application submitted for approval:', response);
     })
     .catch(error => {
       console.error('Error submitting for approval:', error);
     });
   ```

- If **no attachments** were required or added, your application is automatically submitted after `ApplyId`, and you can proceed to wait for approval.

---

### **Step 7: Monitor Your Application Status**

Since updates aren't real-time, you need to check the status manually.

**How to Monitor:**

- **Get Updates:**

  ```javascript
  agentApi.Xmpp.PopMessages()
    .then(messages => {
      console.log('Received messages:', messages);
      // Check for updates related to your identity application
    })
    .catch(error => {
      console.error('Error fetching messages:', error);
    });
  ```

- **Check Status Directly:**

  ```javascript
  agentApi.Legal.GetIdentity(legalId)
    .then(identity => {
      console.log('Identity status:', identity.data.status);
    })
    .catch(error => {
      console.error('Error fetching identity status:', error);
    });
  ```

**Application States:**

- **Created:** Submitted but not yet approved.
- **Approved:** You're all set!
- **Rejected:** You'll need to reapply.

---

### **Final Step: Start Using Your Wallet**

Once approved:

- **Wallet Access:** Your wallet is automatically created.

  ```javascript
  agentApi.Wallet.GetBalance()
    .then(balance => {
      console.log('Wallet balance:', balance);
    })
    .catch(error => {
      console.error('Error fetching wallet balance:', error);
    });
  ```

- **Transactions:** Use your cryptographic key for secure transactions.
- **Smart Contracts:** Sign contracts using your verified identity.

---

## **Additional Tips**

- **Security First:** Keep your passwords and cryptographic keys confidential.
- **Regular Checks:** Monitor your application status for any updates.
- **Refer to API Docs:** For detailed information on API calls and parameters.
- **Error Handling:** Always include `.catch` blocks to handle errors gracefully.
- **Domain Configuration:** Ensure the `SetHost` function is called to set your Neuron® domain.
- **Function Hierarchy:** Use the correct function hierarchy as per the Agent API structure (e.g., `agentApi.Account.Create`).

---

**Congratulations!** You've set up your account, created a wallet, and applied for a digital identity using the Agent API JavaScript implementation.

---

This updated tutorial now includes:

- **Setting the Host:** Using `agentApi.IO.SetHost` to set the Neuron® domain.
- **Correct Function Hierarchy:** All function calls now use the correct hierarchy based on the structure you provided (e.g., `agentApi.Account.Create`, `agentApi.Crypto.CreateKey`, `agentApi.Legal.ApplyId`).
- **Pascal Casing:** Function names are in PascalCase where appropriate.

Let me know if there's anything else you'd like me to adjust or clarify!