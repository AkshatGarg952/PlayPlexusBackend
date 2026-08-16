import express from 'express';
import User from './user.schema.js';
import { createAccountRepository } from '../accounts/account.repository.js';
import { createAccountController } from '../accounts/account.controller.js';
import { uploadProfileImage } from '../../middleware/multer.middleware.js';
import jwtAuth from '../../middleware/jwt.auth.js';

const repository = createAccountRepository({
  Model: User,
  label: 'User',
  uniqueFields: [{ field: 'username', message: 'User with this username already exists!' }],
});

const controller = createAccountController({
  repository,
  resourceKey: 'user',
  imageField: 'profileImage',
  textFields: ['name', 'username', 'email', 'password', 'phone', 'location', 'bio'],
});

const userRouter = express.Router();

userRouter.post('/register', uploadProfileImage, controller.register);
userRouter.post('/login', controller.login);

userRouter.get('/details/:id', jwtAuth, controller.getDetails);
userRouter.get('/allUsers/:id', jwtAuth, controller.getAll);
userRouter.post('/update/:id', jwtAuth, uploadProfileImage, controller.update);
userRouter.get('/filterbyLocation/:location', jwtAuth, controller.filterByLocation);
userRouter.get('/filter/:sport/:loca/:id', jwtAuth, controller.filter);

export default userRouter;
