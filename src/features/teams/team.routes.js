import express from 'express';
import Team from './team.schema.js';
import { createAccountRepository } from '../accounts/account.repository.js';
import { createAccountController } from '../accounts/account.controller.js';
import { uploadTeamLogo } from '../../middleware/multer.middleware.js';
import jwtAuth from '../../middleware/jwt.auth.js';

const repository = createAccountRepository({
  Model: Team,
  label: 'Team',
  uniqueFields: [{ field: 'name', message: 'Team with this name already exists!' }],
});

const controller = createAccountController({
  repository,
  resourceKey: 'team',
  imageField: 'logo',
  textFields: ['name', 'leader', 'email', 'password', 'phone', 'location', 'bio'],
});

const teamRouter = express.Router();

teamRouter.post('/register', uploadTeamLogo, controller.register);
teamRouter.post('/login', controller.login);

teamRouter.get('/details/:id', jwtAuth, controller.getDetails);
teamRouter.get('/allTeams/:id', jwtAuth, controller.getAll);
teamRouter.post('/update/:id', jwtAuth, uploadTeamLogo, controller.update);
teamRouter.get('/filterbyLocation/:location', jwtAuth, controller.filterByLocation);
teamRouter.get('/filter/:sport/:loca/:id', jwtAuth, controller.filter);

export default teamRouter;
