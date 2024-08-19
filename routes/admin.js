const expres = require('express')
const router = expres.Router()
const mongoose = require('mongoose')
require('../models/Categoria')
const Categoria = mongoose.model('Categoria')
require('../models/Postagem')
const Postagem = mongoose.model('postagens')

router.get('/', function(req , res){
   res.render('admin/index')
})

router.get('/post', function(req,res){
    res.send('pagina de posts')
})

router.get('/categorias', (req, res) => {
  Categoria.find().sort({date:"desc"}).lean().then((categorias) => {
      res.render('admin/categorias', {categorias: categorias})
  }).catch((err) => {
      req.flash('error_msg', 'Erro ao listar categorias')
      res.redirect('/admin')
  })
})

router.get('/categorias/add', function(req , res){
    res.render('admin/addcategorias')
})

router.post('/categorias/nova', function(req , res){

  var erros = []

  if(!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null){
    erros.push({text: 'nome invalido'})
  }

  if(!req.body.slug || typeof req.body.slug == undefined || req.body.slug == null) {
    erros.push({text: 'slug invalido'})
  }

  if(req.body.nome.length < 2) {
    erros.push({text:'nome da categoria pequena'})
  }

  if(erros.length > 0) {
      res.render('admin/addcategorias',{erros: erros})
  } else {
      const novaCategoria = {
          nome: req.body.nome,
          slug: req.body.slug
      }
  
      new Categoria(novaCategoria).save().then(function(categoriaSalva){
        res.redirect('/admin/categorias')
      }).catch(function(erro){
          console.log('categoria com erro' + erro)
      })
  }
})

router.get("/categorias/edit/:id",(req, res) =>{
  Categoria.findOne({_id:req.params.id}).then((categoria) =>{ 
      res.render("admin/editcategorias", {categoria: categoria})
  }).catch((err) =>{
      req.flash('error_msg', "Esta categoria não existe")
      res.redirect("/admin/categorias")
  })
})

router.post('/categorias/edit', function(req , res) {
  Categoria.findOne({_id: req.body.id}).then((categoria)=>{

    categoria.nome = req.body.nome
    categoria.slug = req.body.slug

    categoria.save().then(()=>{
       res.flash('success_msg','categoria editada')
       res.redirect('/admin/categorias')
    }).catch((error)=>{
      req.flash(error)
      res.redirect('/admin/categorias')
    }) 

  }).catch((error)=>{
    req.flash(error)
    res.redirect('/admin/categorias')
  })
})

router.post('/categorias/deletar/:id', (req,res) => {
  Categoria.findOneAndDelete({_id: req.params.id}).then(()=> {
      req.flash('success_msg','Categoria deletada com sucesso')
      res.redirect('/admin/categorias')
  }).catch((error) => {
      req.flash('error_msg','Houve um erro ao deletar a categoria')
      res.redirect('/admin/categorias')
  })
})

router.get('/teste/navbarhome', function(req ,res){
  res.send('teste')
})



router.get('/postagens', (req, res) => {
  Postagem.find().populate('categoria').lean()
    .then(postagens => {
      res.render('admin/postagens', { postagens: postagens });
    })
    .catch(err => {
      req.flash('error_msg', 'Erro ao listar postagens');
      res.redirect('/admin');
    });
});


router.get('/postagens/add', function(req, res) {
  Categoria.find().then(function(categorias) {
    res.render('admin/addpostagens', { categorias: categorias });
  }).catch(function(err) {
    req.flash("error_msg", 'Houve um erro ao carregar o formulário');
    res.redirect('/admin');
  });
});

// routes/admin.js
router.post('/postagens/nova', (req, res) => {
  const erros = [];

  if (req.body.categoria === "0") {
    erros.push({ texto: 'Selecione uma categoria antes de criar uma nova postagem' });
  }

  if (erros.length > 0) {
    Categoria.find().then(categorias => {
      res.render('admin/addpostagens', { erros: erros, categorias: categorias });
    });
  } else {
    const novaPostagem = {
      titulo: req.body.titulo,
      descricao: req.body.descricao,
      conteudo: req.body.conteudo,
      categoria: req.body.categoria,
      slug: req.body.slug
    };

    new Postagem(novaPostagem).save()
      .then(() => {
        req.flash('success_msg', `Postagem "${req.body.titulo}" criada com sucesso`);
        res.redirect('/admin/postagens');
      })
      .catch(error => {
        req.flash('error_msg', 'Erro ao criar a postagem');
        console.log('Erro ao cadastrar postagem:', error);
        res.redirect('/admin/postagens');
      });
  }
});

function validarPostagem(req, res, next) {
  const { titulo, slug, descricao, conteudo, categoria } = req.body;
  const erros = [];

  if (!titulo || !slug || !descricao || !conteudo || !categoria) {
    erros.push({ texto: 'Todos os campos são obrigatórios' });
  }

  if (erros.length > 0) {
    req.erros = erros;
    next();
  } else {
    next();
  }
}


router.post('/postagens/edit', (req, res) => {
  const { id, titulo, slug, descricao, conteudo, categoria } = req.body;
  console.log({ id, titulo, slug, descricao, conteudo, categoria }); // Adicione isso para depuração
  
  Postagem.findById(id).then(postagem => {
    if (!postagem) {
      req.flash('error_msg', 'Postagem não encontrada');
      return res.redirect('/admin/postagens');
    }

    postagem.titulo = titulo;
    postagem.slug = slug;
    postagem.descricao = descricao;
    postagem.conteudo = conteudo;
    postagem.categoria = categoria;

    postagem.save()
      .then(() => {
        req.flash('success_msg', 'Postagem atualizada com sucesso');
        res.redirect('/admin/postagens');
      })
      .catch(err => {
        req.flash('error_msg', 'Erro ao atualizar a postagem');
        console.error('Erro ao atualizar postagem:', err);
        res.redirect('/admin/postagens');
      });
  }).catch(err => {
    req.flash('error_msg', 'Erro ao encontrar postagem');
    console.error('Erro ao encontrar postagem:', err);
    res.redirect('/admin/postagens');
  });
});



router.get('/postagens/edit/:id', (req, res) => {
  const { id } = req.params;

  Postagem.findById(id).populate('categoria').then(postagem => {
    Categoria.find().then(categorias => {
      res.render('admin/editpostagens', { postagem, categorias });
    }).catch(err => {
      req.flash('error_msg', 'Erro ao carregar categorias');
      res.redirect('/admin/postagens');
    });
  }).catch(err => {
    req.flash('error_msg', 'Postagem não encontrada');
    res.redirect('/admin/postagens');
  });
});



router.post("/postagens/deletar/:id", (req, res) => {
  Postagem.findOneAndDelete({_id: req.params.id}).then(()=> {
    req.flash('success_msg','Categoria deletada com sucesso')
    res.redirect('/admin/postagens')
}).catch((error) => {
    req.flash('error_msg','Houve um erro ao deletar a categoria')
    res.redirect('/admin/postagens')
});
})

module.exports = router


