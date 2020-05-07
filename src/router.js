const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookie = require('cookie-parser');

const userManager = require('./utils/userManager');

router.use(cookie());

let registredUsers = new userManager();

let loggedUsers = new userManager();

let blackListTokens = [];

let oneDay = 1000 * 60 * 60 * 24;

router.post('/register', async (req, res) => {
  const name = req.body.name;
  const password = await bcrypt.hash(req.body.password, 10);

  if (Boolean(registredUsers.findOne({ name })))
    return res.status(406).json({ error: 'Usuário já cadastrado' });

  registredUsers.addUser({
    name,
    password,
  });

  loggedUsers.addUser({
    name,
  });

  const token = jwt.sign(
    {
      name,
    },
    process.env.SECRET,
    {
      expiresIn: '1d',
    }
  );

  res.cookie(
    'authoz',
    { token },
    {
      maxAge: oneDay,
    }
  );
  return res.send({ message: 'Registro efetuado com sucesso' });
});

router.post('/login', async (req, res) => {
  const { name, password } = req.body;
  const userExists = registredUsers.findOne({ name });
  const userIsLogged = loggedUsers.findOne({ name });

  if (!Boolean(userExists))
    return res.status(401).json({ error: 'Usuário não cadastrado' });

  try {
    const passwordCompare = await bcrypt.compare(password, userExists.password);

    if (!Boolean(passwordCompare)) return res.json({ error: 'Senha inválida' });

    if (Boolean(userIsLogged))
      return res.status(401).json({ error: 'Usuário já esta logado' });

    loggedUsers.addUser({ name });

    const token = jwt.sign(
      {
        name,
      },
      process.env.SECRET,
      {
        expiresIn: '1d',
      }
    );
    res.cookie(
      'authoz',
      { token },
      {
        maxAge: oneDay,
      }
    );
    return res.json({ message: 'Login efetuado com sucesso' });
  } catch (error) {
    console.log(error);
    return;
  }
});

router.post('/chat', (req, res) => {
  const cookieParam = req.cookies;

  if (!cookieParam.authoz) return res.status(401).json({ error: 'Sem token' });
  if (!cookieParam.authoz.token)
    return res.status(401).json({ error: 'Sem token' });

  const {
    authoz: { token },
  } = cookieParam;

  if (!Boolean(token)) return res.status(401).json({ error: 'Sem token' });

  jwt.verify(token, process.env.SECRET, (error, decode) => {
    if (error) return res.json({ error: 'Token inválido' });

    const userExists = registredUsers.findOne({ name: decode.name });

    if (!Boolean(userExists))
      return res.status().json({ error: 'Usuario não existente' });

    return res.json({ user: userExists.name });
  });
});

router.post('/logout', (req, res) => {
  const { name } = req.body;

  const isLogged = loggedUsers.users.findIndex(
    element => element.name === name
  );

  if (isLogged === -1) return res.json({ error: 'Usuário não logado' });

  // Verificação de token *
  const {
    authoz: { token },
  } = req.cookies;

  const verify = jwt.verify(token, process.env.SECRET, (error, decode) => {
    if (error || decode.name !== name)
      return res.json({ error: 'Token inválido' });
  });
  // *
  if (Boolean(verify)) return verify;

  const bannedToken = blackListTokens.find(element => element === token);
  if (Boolean(bannedToken)) return res.json({ error: 'Token vencido' });

  blackListTokens.push(token);

  if (!Boolean(loggedUsers.findOne({ name })))
    return res.json({ error: 'Este usuário não está logado' });

  const removedUser = loggedUsers.users.splice(isLogged, 1);
  res.clearCookie('authoz');
  return res.json({ message: 'Usuário deslogado com sucesso' });
});

module.exports = router;
