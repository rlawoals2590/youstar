import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGODB_URL),
    UserModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  private readonly isDev : boolean = process.env.NODE_ENV === 'dev' ? true : false;
  configure() {
    mongoose.set('debug', this.isDev);
  }
}
