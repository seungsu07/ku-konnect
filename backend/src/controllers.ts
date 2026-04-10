import { JsonController, Get, Post, Param, Body, NotFoundError, All } from 'routing-controllers';
import { IsString, IsInt, IsEmail } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SignupD } from './dto.js';
import { run } from 'effection';

@JsonController('/')
export class RootCon {
    @All('/')
    root() {
        return 'OK';
    }
}

class CertGetD {
    @IsEmail()
        univ_mail!: string;
}

class CertD {
    @IsInt()
        cert_num!: number;
}

@JsonController('/auth')
export class AuthCon {
    @All('/')
    root() {
        return 'OK';
    }
    
    @Post('/signup')
    async signup(@Body() user: SignupD) {
        return await run(function*() {
            return {};
        });
    }
    
    @Post('/signup/cert/get')
    async signupCertGet(@Body() cert: CertGetD) {
        return await run(function*() {
            const mail = cert.univ_mail;
            return [cert instanceof CertGetD, mail];
        });
    }
    
    @Post('/signup/cert')
    async signupCert(@Body() cert: CertD) {
        return await run(function*() {
            const num = cert.cert_num;
            return {};
        });
    }
}