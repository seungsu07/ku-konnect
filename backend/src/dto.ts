import { IsString, IsInt, IsEmail } from 'class-validator';

export class SignupD {
    @IsInt()
        student_id!: number;
    @IsInt()
        college_id!: number;
    @IsEmail()
        univ_mail!: string;
    @IsString()
        id!: string;
    @IsString()
        password!: string;
}