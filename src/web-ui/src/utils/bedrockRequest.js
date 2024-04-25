import axios from 'axios';

const sendToApiGateway = async (input) => {
  const apiGatewayUrl = 'https://05vul39rh6.execute-api.us-west-2.amazonaws.com/test/ask';
  const requestBody = { bedrock_input: input };

  try {
    const response = await axios.post(apiGatewayUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Error sending request to API Gateway:', error);
    throw error;
  }
};

export default sendToApiGateway;