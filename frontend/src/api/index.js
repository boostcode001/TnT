import client from "./client";

export const loginAPI = (username, password) =>
  client.post("/auth/login", { username, password });

export const registerAPI = (username, password) =>
  client.post("/auth/register", { username, password });

export const getProjectsAPI = () => client.get("/projects");
export const createProjectAPI = (name) => client.post("/projects", { name });
export const renameProjectAPI = (id, name) => client.patch(`/projects/${id}`, { name });
export const deleteProjectAPI = (id) => client.delete(`/projects/${id}`);

export const startAnalysisAPI = (projectId, file, onProgress) => {
  const formData = new FormData();
  formData.append("project_id", projectId);
  formData.append("file", file);
  return client.post("/analysis/start", formData, {
    headers: { "Content-Type": undefined },  // 브라우저가 자동으로 boundary 포함해서 설정
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
};
export const getJobStatusAPI = (jobId) => client.get(`/analysis/job/${jobId}`);
export const getJobResultAPI = (jobId) => client.get(`/analysis/job/${jobId}/result`);

export const guestStartAnalysisAPI = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return client.post("/analysis/guest-start", formData, {
    headers: { "Content-Type": undefined },
  });
};

export const claimAnalysisAPI = (jobId, projectName) =>
  client.post("/analysis/claim", null, {
    params: { job_id: jobId, project_name: projectName },
  });
