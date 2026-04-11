import Loki from "lokijs";
import {
    type User,
    type UserProfile,
    type Professor,
    type Course,
    type Lecture,
    type LectureClass,
    type Period,
    type Building,
    type ClassRoom,
    type TimeTable,
    type Roadmap,
    type Post,
    type Board,
} from "../../common/models.js";

const db = new Loki("database.json");

function getDb<T extends { id: string }>(name: string) {
    return (
        db.getCollection<T>(name) ??
        db.addCollection<T>(name, {
            indices: ["id"],
        })
    );
}

export const userDb = getDb<User>("users");
export const userProfileDb = getDb<UserProfile>("userprofiles");
export const professorDb = getDb<Professor>("professors");
export const courseDb = getDb<Course>("courses");
export const lectureDb = getDb<Lecture>("lectures");
export const lectureClassDb = getDb<LectureClass>("lectureclasses");
export const periodDb = getDb<Period>("periods");
export const buildingDb = getDb<Building>("buildings");
export const classRoomDb = getDb<ClassRoom>("classrooms");
export const timeTableDb = getDb<TimeTable>("timetables");
export const roadmapDb = getDb<Roadmap>("roadmaps");
export const postDb = getDb<Post>("posts");
export const boardDb = getDb<Board>("boards");
