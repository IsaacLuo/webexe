import axios from 'axios'

export default function uploadFile(url, file) {
  const formData = new FormData();
  formData.append('file',file)
  const config = {
    headers: {
      'content-type': 'multipart/form-data'
    }
  }
  return axios.post(url, formData,config);
}