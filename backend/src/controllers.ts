import { JsonController, Get, Post, Param, Body, NotFoundError, All } from 'routing-controllers';
import { UserData } from './dto.js';
import { plainToClass } from 'class-transformer';

@JsonController('/')
export class RootCon {
    @All('/')
    root() {
        return 'OK';
    }
}

@JsonController('/auth')
export class AuthCon {
    @All('/')
    root() {
        return 'OK';
    }
    
    @Post('/signup')
    signup(@Body({ required: true, validate: true }) user: UserData) {
        console.log(user instanceof UserData);
        console.log(plainToClass(UserData, user));
        return user;
    }
}