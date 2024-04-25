import React, { useCallback, useEffect, useRef, useState } from "react";
import { findDOMNode } from "react-dom";
import { Alert, Col, Container, Form, FormGroup, Row, Spinner } from "react-bootstrap";
import { mapResults } from "../utils";
import { detectCustomLabels } from "../utils/gateway";

import FileUpload from "./FileUpload";
import LabelsSummary from "./LabelsSummary";
import ProjectSelect from "./ProjectSelect";

const validProjectVersionState = "RUNNING";

const ImageMode = ({ gateway, projectVersionArn }) => {
  const [apiResponse, setApiResponse] = useState(undefined);
  const [detectedLabels, setDetectedLabels] = useState(undefined);
  const [productDetails, setProductDetails] = useState(undefined);
  const [errorDetails, setErrorDetails] = useState("");
  const [formState, setFormState] = useState("initial");
  const [image, setImage] = useState(undefined);
  const [imageCoordinates, setImageCoordinates] = useState({});
  const [projects, setProjects] = useState(undefined);
  const [projectVersion, setProjectVersion] = useState(projectVersionArn);

  const imageContainer = useRef(undefined);

  const resetSummary = () =>
    setDetectedLabels(undefined) && setErrorDetails("");

  const validateImage = (type, size) => {
    const validType = ["data:image/jpeg;base64", "data:image/png;base64"].includes(type);
    const validSize = size < 4000000;
    const result = { isValid: validType && validSize };
    const errors = [];
    if (!validType) errors.push("the image format is not valid");
    if (!validSize) errors.push("the image size is not valid");
    if (errors.length > 0) result.error = errors.join(" and ");
    return result;
  };

  const processImage = (file) => {
    resetSummary();
    const reader = new FileReader();
  
    reader.onload = () => {
      const [type, content] = reader.result.split(",");
      const validationResult = validateImage(type, file.size);
  
      if (validationResult.isValid) {
        setImage(content);
        setFormState("ready"); 
      } else {
        setImage(undefined);
        setFormState("error");
        setErrorDetails(validationResult.error);
      }
    };
    reader.onerror = () => {
      setFormState("error");
      setErrorDetails("Failed to read image.");
    };
  
    reader.readAsDataURL(file);
  };

  const tryFetchingLabels = useCallback(async () => {
    setFormState("loading");
    try {
        const response = await detectCustomLabels(projectVersion, image);
        setApiResponse(response);  // Set the entire response from detectCustomLabels
        setDetectedLabels(response.CustomLabels);  // Assume response has a property CustomLabels

        const productResponse = await gateway.generateProductDescription(image, JSON.stringify(response, undefined, 2));
        const parsedResponse = JSON.parse(productResponse.body);
        setProductDetails(parsedResponse.Answer); 
        setFormState("processed");
    } catch (e) {
        setFormState("error");
        setErrorDetails(e.message || "An unexpected error occurred");
    }
}, [projectVersion, image, gateway]);

// Then your useEffect
useEffect(() => {
  if (formState === "ready" && image && projectVersion) {
    tryFetchingLabels();  // This is now a memoized callback
  }
}, [formState, image, projectVersion, tryFetchingLabels]); // Reacting only when necessary
  


  /*const calculateImageCoordinates = () => {
    const node = findDOMNode(imageContainer.current);
    if (!node) return;
    setImageCoordinates(node.getBoundingClientRect());
  };

  const scrollHandler = useCallback(() => calculateImageCoordinates(), []);*/

  useEffect(() => {
    gateway.describeProjects().then((x) =>
      Promise.all(
        x.ProjectDescriptions.map((project) =>
          gateway.describeProjectVersions(project.ProjectArn)
        )
      ).then((x) => {
        const result = mapResults(x, validProjectVersionState);
        if (result.length === 0) {
          setErrorDetails(
            `There are no project versions with State=${validProjectVersionState} in the current account. This is mandatory in order to use this demo`
          );
          setFormState("error");
        }
        setProjects(result);
      })
    );
  }, [gateway]);

  useEffect(() => {
    const scrollHandler = () => {
      const node = findDOMNode(imageContainer.current);
      if (!node) return;
      setImageCoordinates(node.getBoundingClientRect());
    };
  
    window.addEventListener("scroll", scrollHandler);
  
    return () => {
      window.removeEventListener("scroll", scrollHandler);
    };
  }, []); 

  /*useEffect(() => {
    const fetchData = async () => {
      if (formState === "ready") {
        calculateImageCoordinates();
        try {
          const response = await gateway.detectLabelsAndGetProduct(projectVersion, image);
          setApiResponse(response);
          setDetectedLabels(response.labels);
          setProductDetails(response.product);
          setFormState("processed");
        } catch (e) {
          setFormState("error");
          setErrorDetails(e.message || "An unexpected error occurred");
        }
      }
    };
  
    window.addEventListener("scroll", scrollHandler);
    fetchData();
  

    return () => window.removeEventListener("scroll", scrollHandler);
  }, [formState, gateway, image, projectVersion, scrollHandler]);*/

  return (
    <Row className="tab-content">
      <Col md={12} sm={6} className="h100">
        <Container>
          <Alert
            variant="danger"
            style={{
              display: formState === "error" ? "block" : "none",
            }}
          >
            An error happened{errorDetails && `: ${errorDetails}`}.{" "}
            <a href={window.location.href}>Retry</a>.
          </Alert>
          <Row>
            <Col
              md={12}
              sm={6}
              style={{
                textAlign: "left",
                marginLeft: "20px",
                paddingBottom: "40px",
              }}
            ></Col>
            <Col md={8} sm={6}>
              {image && (
                <img
                  alt="The uploaded content"
                  ref={(x) => (imageContainer.current = x)}
                  src={`data:image/png;base64, ${image}`}
                  style={{ width: "100%", margin: "10px" }}
                />
              )}
            </Col>
            <Col md={4} sm={6}>
              {projects && Object.keys(projects).length > 0 && (
                <Form>
                  <ProjectSelect
                    onChange={tryFetchingLabels}
                    onMount={setProjectVersion}
                    projects={projects}
                    preSelected={projectVersion}
                  />
                  <FormGroup>
                    <FileUpload
                      id="asd"
                      onChange={(e) => processImage(e.target.files[0])}
                    />
                  </FormGroup>
                </Form>
              )}
              {formState === "ready" && (
                <Spinner animation="border" role="status">
                  <span className="sr-only">Loading...</span>
                </Spinner>
              )}
              {formState !== "ready" && (
                <LabelsSummary
                  apiResponse={apiResponse}
                  containerCoordinates={imageCoordinates}
                  detectedLabels={detectedLabels}
                  productDetails={productDetails}
                  image={image}
                  projectVersionArn={projectVersion}
                  showLabelBoundingBoxes={true}
                />
              )}
            </Col>
          </Row>
        </Container>
      </Col>
    </Row>
  );
};

export default ImageMode;
