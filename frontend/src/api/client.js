const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function getStudents(search = '', department = '') {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (department) params.append('department', department);

  const url = `${API_BASE_URL}/api/students${params.toString() ? '?' + params.toString() : ''}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch students');
  }
  return data.data;
}

export async function getStudentById(id) {
  const res = await fetch(`${API_BASE_URL}/api/students/${encodeURIComponent(id)}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch student');
  }
  return data.data;
}

export async function createStudent(studentData) {
  const res = await fetch(`${API_BASE_URL}/api/students`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(studentData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to create student');
  }
  return data;
}

export async function updateStudent(id, studentData) {
  const res = await fetch(`${API_BASE_URL}/api/students/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(studentData)
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update student');
  }
  return data;
}

export async function deleteStudent(id) {
  const res = await fetch(`${API_BASE_URL}/api/students/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete student');
  }
  return data;
}

export { API_BASE_URL };
