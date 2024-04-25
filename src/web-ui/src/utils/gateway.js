import request from "./request";
import sendToApiGateway from "./bedrockRequest";

export const detectCustomLabels = (projectVersionArn, image) => {
  return request("DetectCustomLabels", {
    Image: { Bytes: image },
    ProjectVersionArn: projectVersionArn,
  });
};

const gateway = {
  describeProjects() {
    return request("DescribeProjects");
  },

  describeProjectVersions(projectArn) {
    return request("DescribeProjectVersions", { ProjectArn: projectArn });
  },

  startProjectVersion(projectVersionArn, minInferenceUnits) {
    return request("StartProjectVersion", {
      ProjectVersionArn: projectVersionArn,
      MinInferenceUnits: minInferenceUnits,
    });
  },

  stopProjectVersion(projectVersionArn) {
    return request("StopProjectVersion", {
      ProjectVersionArn: projectVersionArn,
    });
  },

  async generateProductDescription(image, labels) {
    const entity = {
      "anthropic_version": "bedrock-2023-05-31",
      "max_tokens": 1000,
      "messages": [
        {
          "role": "user",
          "content": [
            {
              "type": "image",
              "source": {
                "type": "base64",
                "media_type": "image/jpeg",
                "data": image
              }
            },
            {
              "type": "text",
              "text": `Generate a new product description for this image including the slight wear and tear based on these detected labels: ${labels}`
            }
          ]
        }
      ]
    };

    return sendToApiGateway(entity);
  }
};

export default gateway;
