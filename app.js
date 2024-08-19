// Carregando módulos
const express = require('express');
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('connect-flash');
const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');
const admin = require('./routes/admin'); // Certifique-se de que esse caminho está correto
require("./models/Postagem")
const postagens = mongoose.model('postagens')

// Inicializando o Express
const app = express();

// Configurações de Sessão
app.use(session({
  secret: 'cursodenovo',
  resave: true,
  saveUninitialized: true,
}));

app.use(flash());

// Middleware para passar mensagens de flash para as views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});

// Configuração do Body Parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuração do Handlebars
const hbs = handlebars.create({
  defaultLayout: 'main',
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  runtimeOptions: {
    allowProtoMethodsByDefault: true,
    allowProtoPropertiesByDefault: true,
  }
});
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Conexão com MongoDB
mongoose.connect('mongodb://localhost/blogapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB conectado');
}).catch(err => {
  console.error('Erro ao conectar ao MongoDB:', err);
});


// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rotas


app.get("/404" ,(req,res) => {
 res.send("Error 404")
})


app.get('/post', (req, res) => {
  res.send('Posts');
});

app.use('/admin', admin);



// Configuração do servidor
const PORT = 8031;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta http://localhost:8031`);
});




app.get('/', (req, res) => {
  postagens.find().populate("categoria").sort({data: "desc"}).then((postagens) => {
    res.render("index",{postagens:postagens})
  }).catch((error)=> {
   req.flash("error_msg","Houve um erro interno")
   res.redirect("/404")
  })
});