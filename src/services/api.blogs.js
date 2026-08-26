import apiClient from "../axios.config.js";
import { notifyOnSuccess, notifyOnFail } from "../utils/notification/toast.js";
import { getApiErrorMessage } from "../utils/apiError";

// Blog Routes
export const getAllBlogs = async () => {
  try {
    const res = await apiClient.get("/blogs/posts");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const getAll = async () => {
  try {
    const res = await apiClient.get("/blogs/allposts");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const getBlogBySlug = async (slug) => {
  try {
    const res = await apiClient.get(`/blogs/posts/${slug}`);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const getBlogById = async (id) => {
  try {
    const res = await apiClient.get(`/blogs/postsById/${id}`);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const createBlog = async (authorId, blogData) => {
  try {
    const res = await apiClient.post(`/blogs/posts/${authorId}`, blogData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const updateBlog = async (id, blogData) => {
  try {
    const res = await apiClient.put(`/blogs/posts/${id}`, blogData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const updateStatus = async (blogId, data) => {
  try {
    const res = await apiClient.put(`/blogs/updatestatus/${blogId}`, data);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
    } else {
      notifyOnFail(res.data.message);
    }
    return res.data;
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return error.response || error;
  }
};

export const deleteBlog = async (id) => {
  try {
    const res = await apiClient.delete(`/blogs/posts/${id}`);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

// Blog Category Routes
export const getAllBlogCategories = async () => {
  try {
    const res = await apiClient.get("/blogcategory/getall");
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const getBlogCategoryById = async (id) => {
  try {
    const res = await apiClient.get(`/blogcategory/getById/${id}`);
    if (res.data.status === 1) {
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const createBlogCategory = async (categoryData) => {
  try {
    const res = await apiClient.post("/blogcategory/create", categoryData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const updateBlogCategory = async (id, categoryData) => {
  try {
    const res = await apiClient.put(`/blogcategory/update/${id}`, categoryData);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};

export const deleteBlogCategory = async (id) => {
  try {
    const res = await apiClient.delete(`/blogcategory/delete/${id}`);
    if (res.data.status === 1) {
      notifyOnSuccess(res.data.message);
      return res.data;
    } else {
      notifyOnFail(res.data.message);
      return null;
    }
  } catch (error) {
    notifyOnFail(getApiErrorMessage(error, "Error reaching the server"));
    console.log(error);
    return null;
  }
};
