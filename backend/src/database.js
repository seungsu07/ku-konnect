/**
 * @import { TypeEntity, Session, WithoutID, Entity, User, UserProfile, Department, Professor, Course, Lecture, LectureClass, Period, TimeTable, GraduationProgress, Building, ClassRoom, Comment, Post, Board, EntityType } from '../../common/models'
 * @import { RunningController, MonoController } from './controller'
 * @import { ServerContext } from './server'
 */

import loki from 'lokijs';
import { Temporal } from '@js-temporal/polyfill';





// ====================
// Database
// ====================

/**
 * @param {ServerContext} context
 * @param {RunningController} rcon
 */

export function DatabaseManager(context, rcon) {
    const db = new loki('./database/index.json', {
        autoload: true,
        autoloadCallback: () => {
            console.log('Database loaded');
        }
    });
    
    const collection =
        db.getCollection('entities') ??
        db.addCollection('entities', { unique: ['id'], indices: ['type'] });

    return {
        /** @type {MonoController} */
        controller: rcon.outer,
        
        /**
         * @template {EntityType} T
         * @param {T} type
         * @param {any} param
         * @returns {TypeEntity<T>}
         */
        createEntity(type, param) {
            const entity = {
                id: crypto.randomUUID(),
                type,
                ...param
            };
            return collection.add(entity);
        },
        
        /**
         * @template {EntityType} T
         * @param {`${string}-${string}-${string}-${string}-${string}`} id
         * @param {T} type
         * @returns {TypeEntity<T> | undefined}
         */
        findByID(id, type) {
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
         */
        findByType(type) {
            return /** @type {loki.Collection<TypeEntity<T>>} */ (collection).chain().find(/** @type {any} */ ({ type }));
        },
        
        /**
         * @param {TypeEntity<EntityType>} entity
         */
        updateEntity(entity) {
            return collection.update(entity);
        },
        
        /**
         * @param {TypeEntity<EntityType>} entity
         */
        deleteEntity(entity) {
            return collection.remove(entity);
        },
        
        test() {
            const a = this.findByID('a-b-c-d-e', 'user');
            
            const b = this.findByType('user');
        },

        /**
         * @returns {Promise<void>}
         */
        async serve(delay = Temporal.Duration.from({ minutes: 3 })) {
            const controller = rcon.inner;
            await controller.start();

            while (true) {

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