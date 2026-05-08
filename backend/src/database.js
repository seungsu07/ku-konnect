/**
 * @import { TypeEntity, Entity, EntityType, EntityID, WithoutID, User, Campus, Department, College } from '../../common/models'
 * @import { DTO } from '../../common/dto'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 */

import loki from 'lokijs';
import { Temporal } from '@js-temporal/polyfill';
import JSON_CAMPUSES from '../../common/default/campuses.json' with { type: 'json' };
import JSON_COLLEGES from '../../common/default/colleges.json' with { type: 'json' };
import JSON_DEPARTMENTS from '../../common/default/departments.json' with { type: 'json' };





// ====================
// Database
// ====================

/** @typedef {ReturnType<typeof CreateDatabaseManager>} DatabaseManager */

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */
export function CreateDatabaseManager(context, rcon) {
    const db = new loki('database.json', {
        autoload: true,
        autoloadCallback: () => {
            console.log('Database loaded');
        },
        autosave: true,
        autosaveInterval: 60000,
        autosaveCallback: () => {
            console.log('Database saved');
        }
    });
    
    /** @type {Collection<Entity<EntityType>>} */
    const collection =
        db.getCollection('entities') ??
        (() => {
            const col = db.addCollection('entities', { unique: ['id'], indices: ['type'] });
            col.insert(JSON_CAMPUSES);
            col.insert(JSON_COLLEGES);
            col.insert(JSON_DEPARTMENTS);
            return col;
        })();

    return {
        /** @type {MonoController} */
        controller: rcon.outer,
        
        /**
         * @template {EntityType} T
         * @param {T} type
         * @param {WithoutID<TypeEntity<T>>} param
         * @returns {TypeEntity<T> & LokiObj | undefined}
         */
        createEntity(param, type) {
            if (param.type != type) return undefined;
            const idparam = {
                id: crypto.randomUUID(),
                ...param
            };
            /** @type {any} */
            const entity = collection.insertOne(idparam);
            return entity;
        },
        
        /**
         * @template {EntityType} T
         * @param {T} type
         * @param {EntityID<T>} id
         * @returns {TypeEntity<T> & LokiObj | undefined}
         */
        getByID(type, id) {
            /** @type {any} */
            const entity = collection.by('id', id);
            if (entity?.type == type) {
                return entity;
            } else {
                return undefined;
            }
        },
        
        /**
         * @template {EntityType} T
         * @param {T} type
         * @returns {Resultset<TypeEntity<T> & LokiObj>}
         */
        findByType(type) {
            /** @type {any} */
            const chain = collection.chain().find({ type });
            return chain;
        },
        
        /**
         * @template {EntityType} T
         * @param {TypeEntity<T>} entity
         * @returns {TypeEntity<T> & LokiObj}
         */
        updateEntity(entity) {
            /** @type {any} */
            const result = collection.update(entity);
            return result;
        },
        
        /**
         * @template {EntityType} T
         * @param {TypeEntity<T>} entity
         * @returns {TypeEntity<T> & LokiObj | null}
         */
        deleteEntity(entity) {
            /** @type {any} */
            const result = collection.remove(entity);
            return result;
        },
        
        /**
         * @returns {(Campus & LokiObj)[]}
         */
        getCampuses() {
            /** @type {any} */
            const campuses = collection.find({ type: 'campus' });
            return campuses;
        },
        
        /**
         * @returns {(College & LokiObj)[]}
         */
        getColleges() {
            /** @type {any} */
            const colleges = collection.find({ type: 'college' });
            return colleges;
        },
        
        /**
         * @returns {(Department & LokiObj)[]}
         */
        getDepartments() {
            /** @type {any} */
            const departments = collection.find({ type: 'department' });
            return departments;
        },
        
        /**
         * @param {DTO.Auth.Signup['POST']['Request']} data
         * @returns {DTO.Auth.Signup['POST']['Response']}
         */
        signUpUser(data) {
            const {
                campus: campusName,
                college: collegeName,
                department: majorCode,
                student_id,
                name,
                login: {
                    id,
                    password
                },
                univ_mail: {
                    address,
                    token
                }
            } = data;
            
            // mail
            
            const campus = this.findByType('campus').find({ name: campusName }).data()[0];
            if (!campus)
                return {
                    success: false,
                    e: 'campus_doesnt_exist'
                };
            const college = this.findByType('college').find({ campus: campus.id, name: collegeName }).data()[0];
            if (!college)
                return {
                    success: false,
                    e: 'college_doesnt_exist'
                };
            const major = this.findByType('department').find({ college: college.id, code: majorCode }).data()[0];
            if (!major)
                return {
                    success: false,
                    e: 'department_doesnt_exist'
                }
            /** @type {WithoutID<User>} */
            const param = {
                type: 'user',
                login: {
                    id,
                    password
                },
                name,
                profiles: [],
                student_id,
                campus: campus.id,
                college: college.id,
                department: {
                    major: major.id,
                    minor: null,
                    status: 'none'
                },
                univ_mail: address,
                mail: null,
                data: {
                    timetables: [],
                    graduation_progress: null,
                    posts: [],
                    comments: []
                }
            };
            const user = this.createEntity(param, 'user');
            return user?
                {
                    success: true
                }:
                {
                    success: false,
                    e: 'unexpected'
                };
        },

        /**
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
            await controller.start();

            while (true) {
                const { promise: db_save, resolve: db_save_resv } = Promise.withResolvers();
                db.save(db_save_resv);
                const err = await db_save;
                if (err) console.error(err);
                const { promise: delay_prom, resolve } = Promise.withResolvers();
                setTimeout(resolve, delay.total('millisecond'));
                await Promise.any([delay_prom, controller.waitFor(false)]);
                if (controller.isPendingFor().stop) {
                    break;
                }
            }

            await controller.stop();
        }
    };
}