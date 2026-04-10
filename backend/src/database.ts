import Loki from 'lokijs';

export const db = new Loki('database.json');
export const userDb =
    db.getCollection('users') ??
    db.addCollection('users', {
        indices: ['student_id']
    });
