# **Quick Start Guide: Creating a Neuro-Feature™ Token Using the Agent API (JavaScript Implementation)**

This tutorial will guide you through the process of creating a **Neuro-Feature™ token** using the Agent API with JavaScript. It assumes you already have an account and a wallet set up. If you don't, please refer to the previous guide on setting up an account and wallet.

---

## **Overview**

With the Agent API JavaScript implementation, you can:

- **Create Neuro-Feature™ Tokens** on a Neuron® network.
- **Interact with Smart Contracts** for token creation.
- **Manage Token Ownership** and transfer.

---

## **Prerequisites**

- **Agent API JavaScript Library:** Access the library from the repository: [AgentApiJavascript](https://github.com/Trust-Anchor-Group/AgentApiJavascript/blob/main/Root/Agent.js).
- **Account and Wallet:** You should have an existing account and wallet.
- **Smart Contract Template ID:** The ID of the smart contract template for token creation.
- **API Key and Secret:** Provided by your operator.
- **Neuron® Domain:** The domain (host) of the Neuron® where API calls are made.
- **Node.js Environment:** For running JavaScript code.

---

## **Step-by-Step Guide**

### **Step 1: Initialize the Agent API and Set the Host**

First, integrate the Agent API JavaScript library into your project.

**Initialization and Setting the Host:**

```javascript
const agentApi = AgentAPI; // Using the global AgentAPI object from the script

// Set the host (Neuron® domain) where API calls are made
agentApi.IO.SetHost('YOUR_NEURON_DOMAIN');
```

**Important:**

- Replace `'YOUR_NEURON_DOMAIN'` with the domain of the Neuron® you are connecting to.

---

### **Step 2: Ensure You Have an Account and Wallet**

Before creating a token, ensure you have:

- **An Active Account:** If not, refer to the account creation guide.
- **A Wallet:** Automatically created upon identity approval.

---

### **Step 3: Obtain a Smart Contract Template ID**

You'll need a **Contract ID** for the token creation template.

- **Source of Templates:**
  - Templates are created and approved by Neuron® operators.
  - Use existing templates from the **LegalLab repository** for testing and development.

**Note:** Templates define how tokens are created and their legal context.

---

### **Step 4: Understand Roles and Parameters**

Before creating a contract, understand the roles and parameters required by the template.

#### **Common Roles:**

- **Creator (Required):** The party creating the token (you).
- **Owner (Optional):** If different from the creator.
- **TrustProvider (Required):** The Neuron® itself.
- **Others (Optional):** Valuator, Assessor, Certifier, Witness.

#### **Common Parameters:**

- **Value (Optional):** Initial value of the token.
- **Currency (Optional):** Currency of the token.
- **CommissionPercent (Optional):** Commission percentage for token creation.

**Tip:** Use `GetCreationAttributes` to fetch required roles and parameters.

---

### **Step 5: Get Token Creation Attributes**

Fetch attributes like **Currency**, **CommissionPercent**, and the **TrustProvider's Legal Identity**.

```javascript
agentApi.Tokens.GetCreationAttributes()
  .then(response => {
    console.log('Token creation attributes:', response);
    // Use these attributes in the next steps
    proceedWithContractCreation(response);
  })
  .catch(error => {
    console.error('Error fetching token creation attributes:', error);
  });

function proceedWithContractCreation(attributes) {
  // Proceed to the next step
}
```

---

### **Step 6: Create a Smart Contract for Token Creation**

Use the `CreateContract` function under the `Legal` namespace.

**Requirements:**

- **Template ID:** The ID of the smart contract template.
- **Visibility:** Determines who can see the contract (e.g., "Public").
- **Parts (Roles):** Define the roles and associated legal identities.
- **Parameters:** Provide values for required parameters.

**Process:**

```javascript
const templateId = 'YOUR_TEMPLATE_ID'; // Replace with your template ID
const visibility = 'Public'; // Or as required
const trustProviderId = 'TRUST_PROVIDER_LEGAL_ID'; // From Step 5
const creatorLegalId = 'YOUR_LEGAL_ID'; // Your legal identity ID

// Define the roles
const parts = [
  {
    'role': 'Creator',
    'legalId': creatorLegalId
  },
  {
    'role': 'TrustProvider',
    'legalId': trustProviderId
  }
  // Add other roles if necessary
];

// Define the parameters
const parameters = {
  'Value': '1000',
  'Currency': 'USD',
  'CommissionPercent': '5'
  // Add other parameters if required
};

agentApi.Legal.CreateContract(templateId, visibility, parts, parameters)
  .then(response => {
    console.log('Contract created successfully:', response);
    const contractId = response.data.contractId; // Save this ID for later
  })
  .catch(error => {
    console.error('Error creating contract:', error);
  });
```

**Note:**

- Ensure you have the **Legal Identity IDs** for all roles.
- Adjust the **parameters** based on the template requirements.

---

### **Step 7: Retrieve the Human-Readable Text of the Contract**

Optionally, get the contract content to display or review.

```javascript
const format = 'Html'; // Options: 'Markdown', 'Html', 'Text', 'Xaml', 'XamarinXaml'

agentApi.Legal.GetContract(contractId, format)
  .then(contract => {
    console.log('Contract content:', contract);
    // Display or process the contract content as needed
  })
  .catch(error => {
    console.error('Error fetching contract:', error);
  });
```

---

### **Step 8: Sign the Smart Contract**

Each party must sign the contract using `SignContract`.

**Before Signing: Get Key Algorithm Information**

Use `GetPublicKey()` to retrieve the algorithm information used when the key was created.

```javascript
agentApi.Crypto.GetPublicKey(keyId)
  .then(response => {
    const algorithm = response.Algorithm;
    const localName = algorithm.localName;
    const namespace = algorithm.namespace;
    console.log('Algorithm used for key:', algorithm);

    // Proceed to sign the contract using the correct algorithm details
    signContract(localName, namespace);
  })
  .catch(error => {
    console.error('Error fetching public key:', error);
  });

function signContract(localName, namespace) {
  // Proceed to the signing step
}
```

**Process:**

```javascript
const role = 'Creator';             // The role you're signing as
const keyPassword = 'yourKeyPassword'; // From previous steps
const accountPassword = 'yourPassword'; // Account password
const legalId = creatorLegalId;     // Your legal identity ID

agentApi.Legal.SignContract(localName, namespace, keyId, keyPassword, accountPassword, contractId, legalId, role)
  .then(response => {
    console.log('Contract signed successfully:', response);
    // Monitor the contract status in the next step
  })
  .catch(error => {
    console.error('Error signing contract:', error);
  });
```

**Note:**

- Use the **localName** and **namespace** obtained from `GetPublicKey()`.
- Repeat this process for each role that you control.
- The **TrustProvider** role is signed by the Neuron® automatically after validation.

---

### **Step 9: Monitor Contract Status and Token Creation**

After signing, monitor the contract and token creation status.

**Using PopMessages:**

```javascript
agentApi.Xmpp.PopMessages()
  .then(messages => {
    console.log('Received messages:', messages);
    // Look for messages related to contract status and token creation
  })
  .catch(error => {
    console.error('Error fetching messages:', error);
  });
```

**Checking Contract Status Directly:**

```javascript
agentApi.Legal.GetContract(contractId)
  .then(contract => {
    console.log('Contract status:', contract.data.state);
    // Possible states: Created, Pending, Approved, Rejected, Failed
    if (contract.data.state === 'Approved') {
      console.log('Contract approved, token creation initiated.');
      // Proceed to check token creation
    }
  })
  .catch(error => {
    console.error('Error fetching contract status:', error);
  });
```

**Checking Tokens:**

```javascript
agentApi.Tokens.GetTokens(0, 10)
  .then(tokens => {
    console.log('Tokens:', tokens);
    // Look for the newly created token
  })
  .catch(error => {
    console.error('Error fetching tokens:', error);
  });
```

---

### **Additional: Transferring Ownership of a Token**

Transferring a token involves creating and signing a transfer contract.

**Process Overview:**

1. **Obtain a Transfer Contract Template ID.**
2. **Create a Transfer Contract** specifying the token and terms.
3. **Sign the Contract** as both seller and buyer.
4. **Monitor the Contract and Token Ownership Change.

---

## **Additional Tips**

- **Security First:** Keep your passwords and cryptographic keys confidential.
- **Algorithm Selection:** Use `GetAlgorithms()` to select safe algorithms, and `GetPublicKey()` to retrieve algorithm details when needed.
- **Template Details:** Always refer to the template documentation for required roles and parameters.
- **Regular Checks:** Monitor contract and token statuses for any updates.
- **Error Handling:** Include `.catch` blocks to handle errors gracefully.
- **Notifications:** Use `PopMessages` to receive asynchronous updates from the Neuron®.
- **Compliance:** Ensure compliance with any legal requirements when creating and managing tokens.

---

**Congratulations!** You've successfully created a Neuro-Feature™ token using the Agent API JavaScript implementation.

---

## **Sample Code Summary**

Here's a consolidated version of the key code snippets:

```javascript
// Initialization
agentApi.IO.SetHost('YOUR_NEURON_DOMAIN');

// Step 5: Get Token Creation Attributes
agentApi.Tokens.GetCreationAttributes()
  .then(response => {
    // Use attributes in contract creation
  });

// Step 6: Create Contract
agentApi.Legal.CreateContract(templateId, visibility, parts, parameters)
  .then(response => {
    const contractId = response.data.contractId;
    // Proceed to sign the contract
  });

// Step 8: Get Public Key Algorithm Information
agentApi.Crypto.GetPublicKey(keyId)
  .then(response => {
    const algorithm = response.Algorithm;
    const localName = algorithm.localName;
    const namespace = algorithm.namespace;
    // Proceed to sign the contract
  });

// Step 8: Sign Contract
agentApi.Legal.SignContract(localName, namespace, keyId, keyPassword, accountPassword, contractId, legalId, role)
  .then(response => {
    // Monitor contract status
  });

// Step 9: Monitor Contract and Token Status
agentApi.Legal.GetContract(contractId)
  .then(contract => {
    if (contract.data.state === 'Approved') {
      // Token creation initiated
    }
  });

agentApi.Tokens.GetTokens(0, 10)
  .then(tokens => {
    // Check for new token
  });
```

---

## **Final Notes**

- **Documentation:** Always refer to the latest Agent API documentation for any updates.
- **Legal Considerations:** Ensure compliance with any legal requirements when creating and managing tokens.
- **Support:** Contact your Neuron® operator or support team if you encounter issues.