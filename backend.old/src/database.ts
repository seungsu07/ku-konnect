import Loki from 'lokijs';
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
    type Session,
} from '../../common/models.js';

const db = new Loki('database.json', {
    autoload: true,
    autosave: true
});

function getDb<T extends { id: string }>(name: string) {
    return (
        db.getCollection<T>(name) ??
        db.addCollection<T>(name, {
            indices: ['id'],
        })
    );
}
export namespace Db {
    export const userDb = getDb<User>('users');
    export const userProfileDb = getDb<UserProfile>('userprofiles');
    export const professorDb = getDb<Professor>('professors');
    export const courseDb = getDb<Course>('courses');
    export const lectureDb = getDb<Lecture>('lectures');
    export const lectureClassDb = getDb<LectureClass>('lectureclasses');
    export const periodDb = getDb<Period>('periods');
    export const buildingDb = getDb<Building>('buildings');
    export const classRoomDb = getDb<ClassRoom>('classrooms');
    export const timeTableDb = getDb<TimeTable>('timetables');
    export const roadmapDb = getDb<Roadmap>('roadmaps');
    export const postDb = getDb<Post>('posts');
    export const boardDb = getDb<Board>('boards');
    export const sessionDb = getDb<Session>('sessions');
}