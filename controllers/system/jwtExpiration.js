module.exports = (req, res, signToken, fs) => {
  //writing to file will save changes even in case of system reboot
  fs.readFile('./config.js', 'utf8', function(err, data) {
    if (err) return console.error(err);
    let find = 'JWT_EXPIRATION';
    let re = new RegExp('^.*' + find + '.*$', 'gm');
    let replace = `  JWT_EXPIRATION: '${req.body.quantity + req.body.unit}',`;
    let formatted = data.replace(re, replace);

    fs.writeFile('./config.js', formatted, 'utf8', function(err) {
      if (err) return console.error(err);
    });
  });

  return res.send('success');
};
