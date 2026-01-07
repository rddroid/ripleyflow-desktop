export type PreviewType = "thumbnail" | "clip";

export const getOutputPath = (inputPath: string, format: string, workspacePath: string): string => {
  if (!workspacePath) {
    // Fallback to original location if workspace path is not set
    const lastDotIndex = inputPath.lastIndexOf(".");
    if (lastDotIndex > 0 && lastDotIndex < inputPath.length - 1) {
      return inputPath.substring(0, lastDotIndex) + "." + format;
    } else {
      return inputPath + "." + format;
    }
  }

  // Use workspace path
  const inputFileName = inputPath.split(/[/\\]/).pop() || "video";
  const fileNameWithoutExt = inputFileName.lastIndexOf(".") > 0
    ? inputFileName.substring(0, inputFileName.lastIndexOf("."))
    : inputFileName;
  
  // Ensure workspace path ends with a separator
  const workspace = workspacePath.endsWith("/") || workspacePath.endsWith("\\")
    ? workspacePath
    : workspacePath + (workspacePath.includes("\\") ? "\\" : "/");
  
  return workspace + fileNameWithoutExt + "." + format;
};

export const getPreviewPath = (inputPath: string, previewType: PreviewType, workspacePath: string): string => {
  const extension = previewType === "thumbnail" ? "jpg" : "mp4";
  
  if (!workspacePath) {
    // Fallback to original location if workspace path is not set
    const pathParts = inputPath.split(".");
    return pathParts.slice(0, -1).join(".") + `_preview.${extension}`;
  }

  // Use workspace path
  const inputFileName = inputPath.split(/[/\\]/).pop() || "video";
  const fileNameWithoutExt = inputFileName.lastIndexOf(".") > 0
    ? inputFileName.substring(0, inputFileName.lastIndexOf("."))
    : inputFileName;
  
  // Ensure workspace path ends with a separator
  const workspace = workspacePath.endsWith("/") || workspacePath.endsWith("\\")
    ? workspacePath
    : workspacePath + (workspacePath.includes("\\") ? "\\" : "/");
  
  return workspace + fileNameWithoutExt + `_preview.${extension}`;
};



