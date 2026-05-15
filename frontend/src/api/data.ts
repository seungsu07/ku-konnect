import type { PATH_ROUTE, Scheme } from "../../../common/dto";

const BASE_URL = ''; // Vite proxy

async function fetchData<T extends keyof PATH_ROUTE>(
    path: T,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    data?: any
) {
    const options: RequestInit = {
        method,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    let url = `${BASE_URL}${path}`;
    if (method === 'GET' && data) {
        const jsonStr = JSON.stringify(data);
        url += `?data=${encodeURIComponent(jsonStr)}`;
    } else if (data) {
        options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    return await response.json();
}

// Helper for GET requests that return an array
async function getMany<T extends keyof PATH_ROUTE>(path: T, query: any) {
    const res = await fetchData(path, 'GET', query);
    return res.success ? res.data : [];
}

export const dataApi = {
    // Courses
    getCourses: (query: Scheme<'/api/data/course', 'GET', 'REQ'>) =>
        getMany('/api/data/course', query),
    getCourse: async (query: Scheme<'/api/data/course', 'GET', 'REQ'>) =>
        (await getMany('/api/data/course', query))[0],

    // Professors
    getProfessors: (query: Scheme<'/api/data/professor', 'GET', 'REQ'>) =>
        getMany('/api/data/professor', query),
    getProfessor: async (query: Scheme<'/api/data/professor', 'GET', 'REQ'>) =>
        (await getMany('/api/data/professor', query))[0],

    // Lectures
    getLectures: (query: Scheme<'/api/data/lecture', 'GET', 'REQ'>) =>
        getMany('/api/data/lecture', query),
    getLecture: async (query: Scheme<'/api/data/lecture', 'GET', 'REQ'>) =>
        (await getMany('/api/data/lecture', query))[0],

    // Lecture Classes
    getLectureClasses: (query: Scheme<'/api/data/lectureclass', 'GET', 'REQ'>) =>
        getMany('/api/data/lectureclass', query),
    getLectureClass: async (query: Scheme<'/api/data/lectureclass', 'GET', 'REQ'>) =>
        (await getMany('/api/data/lectureclass', query))[0],

    // Classrooms
    getClassRooms: (query: Scheme<'/api/data/classroom', 'GET', 'REQ'>) =>
        getMany('/api/data/classroom', query),
    getClassRoom: async (query: Scheme<'/api/data/classroom', 'GET', 'REQ'>) =>
        (await getMany('/api/data/classroom', query))[0],

    // Buildings
    getBuildings: (query: Scheme<'/api/data/building', 'GET', 'REQ'>) =>
        getMany('/api/data/building', query),
    getBuilding: async (query: Scheme<'/api/data/building', 'GET', 'REQ'>) =>
        (await getMany('/api/data/building', query))[0],

    // Timetables
    getTimeTables: (query: Scheme<'/api/data/timetable', 'GET', 'REQ'>) =>
        getMany('/api/data/timetable', query),
    createTimeTable: (data: Scheme<'/api/data/timetable', 'POST', 'REQ'>) =>
        fetchData('/api/data/timetable', 'POST', data),
    updateTimeTable: (data: Scheme<'/api/data/timetable', 'PATCH', 'REQ'>) =>
        fetchData('/api/data/timetable', 'PATCH', data),
    deleteTimeTable: (data: Scheme<'/api/data/timetable', 'DELETE', 'REQ'>) =>
        fetchData('/api/data/timetable', 'DELETE', data),

    // Boards
    getBoards: (query: Scheme<'/api/data/board', 'GET', 'REQ'>) =>
        getMany('/api/data/board', query),

    // Posts
    getPosts: (query: Scheme<'/api/data/post', 'GET', 'REQ'>) =>
        getMany('/api/data/post', query),
    createPost: (data: Scheme<'/api/data/post', 'POST', 'REQ'>) =>
        fetchData('/api/data/post', 'POST', data),
    updatePost: (data: Scheme<'/api/data/post', 'PATCH', 'REQ'>) =>
        fetchData('/api/data/post', 'PATCH', data),
    deletePost: (data: Scheme<'/api/data/post', 'DELETE', 'REQ'>) =>
        fetchData('/api/data/post', 'DELETE', data),

    // User Profiles
    getUserProfiles: (query: Scheme<'/api/data/userprofile', 'GET', 'REQ'>) =>
        getMany('/api/data/userprofile', query),
    createUserProfile: (data: Scheme<'/api/data/userprofile', 'POST', 'REQ'>) =>
        fetchData('/api/data/userprofile', 'POST', data),

    // Comments
    getComments: (query: Scheme<'/api/data/comment', 'GET', 'REQ'>) =>
        getMany('/api/data/comment', query),
    createComment: (data: Scheme<'/api/data/comment', 'POST', 'REQ'>) =>
        fetchData('/api/data/comment', 'POST', data),
    updateComment: (data: Scheme<'/api/data/comment', 'PATCH', 'REQ'>) =>
        fetchData('/api/data/comment', 'PATCH', data),
    deleteComment: (data: Scheme<'/api/data/comment', 'DELETE', 'REQ'>) =>
        fetchData('/api/data/comment', 'DELETE', data),

    // Graduation Progress
    getGraduationProgress: (query: Scheme<'/api/data/graduationprogress', 'GET', 'REQ'>) =>
        fetchData('/api/data/graduationprogress', 'GET', query),
    updateGraduationProgress: (data: Scheme<'/api/data/graduationprogress', 'PATCH', 'REQ'>) =>
        fetchData('/api/data/graduationprogress', 'PATCH', data),

    // Study Groups
    getStudyGroups: (query: Scheme<'/api/data/studygroup', 'GET', 'REQ'>) =>
        getMany('/api/data/studygroup', query),
    createStudyGroup: (data: Scheme<'/api/data/studygroup', 'POST', 'REQ'>) =>
        fetchData('/api/data/studygroup', 'POST', data),
    updateStudyGroup: (data: Scheme<'/api/data/studygroup', 'PATCH', 'REQ'>) =>
        fetchData('/api/data/studygroup', 'PATCH', data),
    deleteStudyGroup: (data: Scheme<'/api/data/studygroup', 'DELETE', 'REQ'>) =>
        fetchData('/api/data/studygroup', 'DELETE', data),

    // Study Group Joining (Auth)
    requestJoinStudy: (data: Scheme<'/api/auth/verify/studygroup', 'GET', 'REQ'>) =>
        fetchData('/api/auth/verify/studygroup', 'GET', data),
    joinStudyWithCode: (data: Scheme<'/api/auth/verify/studygroup', 'POST', 'REQ'>) =>
        fetchData('/api/auth/verify/studygroup', 'POST', data),

    // RoadMap Generation
    generateRoadMap: (data: Scheme<'/api/generate/roadmap', 'GET', 'REQ'>) =>
        fetchData('/api/generate/roadmap', 'GET', data),
};

// Legacy support for existing stubs if any
export const getCourses = dataApi.getCourses;
export const getCourse = dataApi.getCourse;
export const getProfessors = dataApi.getProfessors;
export const getProfessor = dataApi.getProfessor;
export const getLectures = dataApi.getLectures;
export const getLecture = dataApi.getLecture;
export const getLectureClasses = dataApi.getLectureClasses;
export const getLectureClass = dataApi.getLectureClass;
export const getClassRooms = dataApi.getClassRooms;
export const getClassRoom = dataApi.getClassRoom;
export const getBuildings = dataApi.getBuildings;
export const getBuilding = dataApi.getBuilding;
export const createTimeTable = dataApi.createTimeTable;
export const getTimeTables = dataApi.getTimeTables;