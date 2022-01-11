require('dotenv').config();

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const mysql   = require('mysql');
const connection = mysql.createConnection({
  host     : 'localhost',
  user     : process.env.DBUSER,
  password : process.env.DBPASS,
  database : process.env.DBNAME
});
const port = 8080;

io.on('connection', (socket) => {
	console.log("user connect");
	
	socket.on("userInfo", obj => {
		console.log(obj.user_id + " login");
		login(obj.user_id, socket);
	})
	
	socket.on("change", obj => {
		console.log(obj.user_id + " changed");
		update(obj)
	})
	
	socket.on("register", obj => {
		console.log(obj.user_id + " register");
		register(obj, socket);
		
	})
	
	socket.on("raid", () => {
		getRaidRanking(socket);
	})
	
	socket.on("boss", obj =>{
		applyGuildDamages(obj.guild, 0, socket);
	})
	
	
	socket.on("raidDamage", obj => {
		applyGuildDamages(obj.guild, obj.damage, socket);
	})
	
	
	
	
	socket.on('disconnect', () => {
		console.log('user disconnect')
	});
})

server.listen(port, function(){
	console.log(`server open at port ${port}`);
})


app.get("/", (req, res) => {
  res.send("OK");

})


function applyGuildDamages(guild, damage, socket){
	
	connection.query(`SELECT hp FROM raid WHERE guild=${guild}`, (_, row, __) =>{
		//console.log(guild, row);
		var curHp = row[0].hp;
		var nowHp = Math.max(0, curHp - damage);
		connection.query(`UPDATE raid SET hp = ${nowHp} where guild=${guild}`, (_, __, ___) => {
			getRaidRanking(io);
		})
		socket.emit("bossHp", `${nowHp}`);
	})
}

function getRaidRanking(socket){
	
	var query1 = "SELECT guild, name, raid_damage FROM users WHERE guild="
	var query2 = " ORDER BY raid_damage DESC"
	
	var raidRanking = [];
	
	
	connection.query(query1+"1"+query2, (_, row1, __)=>{
		connection.query(query1+"2"+query2, (_, row2, __)=>{
			connection.query(query1+"3"+query2, (_, row3, __)=>{
				connection.query(query1+"4"+query2, (_, row4, __)=>{
					
					var rows = [row1, row2, row3, row4];
					
					for(var i=0;i<4;i++){
						
						//var obj = {"guild": i+1, "name": [1], "damage": [10]};
						
						var obj = {"guild": i+1};
						var users = [];

						
						for(var j=0;j<rows[i].length;j++){
							users.push({"name":rows[i][j].name, "damage": rows[i][j].raid_damage});
						}
						
						obj["users"] = users;
						raidRanking.push(obj);
					}
					
					socket.emit("raidInfo", raidRanking);
					
				});
			});
		});
	});
	
}

function register(obj, socket){
	
	
	var userInfo = {};
  	var pokemonInfo = {};
	
			
	connection.query('SELECT MAX(id) FROM users', (_, row, __) => {
		var user_id = row[0]['MAX(id)']+1

		connection.query('SELECT MAX(id) FROM pokemon', (_, prow, __) => {
			var poke_id = prow[0]['MAX(id)']+1
			var skills = [];
			var end_time = new Date().getTime();
			
			connection.query(`INSERT INTO users (id, kakao_id, name, pokemon_id, coin, guild, raid_damage, raid_cnt, end_time)	VALUES (${user_id}, '${obj.user_id}', '${obj.name}', ${poke_id}, 50, ${obj.classValue}, ${0}, ${3}, ${end_time})`,
							(_, __, ___) => {
				
				connection.query(`SELECT * FROM skills WHERE type=${poke_id%3}`, (_, srow, __) => {
					
					for(var i=0;i<8;i++){
						skills.push({"id":(poke_id%3)*8+i, "level":1});
					}
					
				
					connection.query(`INSERT INTO pokemon (id, level, skills, exp, number)
					VALUES (${poke_id}, 1, JSON_MERGE_PATCH(skills, '${JSON.stringify(skills)}'), 0, ${obj.pokeNum})`, 
									(_, __, ___) => {
					
						socket.kakao_id = obj.user_id;
						userInfo["user_id"] = obj.user_id;
						userInfo["coin"] = 50;
						userInfo["name"] = obj.name;
						userInfo["end_time"] = end_time;
						userInfo["raid_damaged"] = 0;
						userInfo["raid_cnt"] = 3;

						pokemonInfo["id"] = poke_id;
						pokemonInfo["level"] = 1;
						pokemonInfo["number"] = obj.pokeNum;
						pokemonInfo["exp"] = 0;
						
						for(var j=0;j<8;j++){
							skills[j]["name"] = srow[j].name;
							skills[j]["cool"] = srow[j].cool;
							skills[j]["power"] = srow[j].power;
						}

						pokemonInfo["skills"] = skills;
						userInfo["pokemon"] = pokemonInfo;
						userInfo["guild"] = obj.classValue;

						//console.log(JSON.stringify(userInfo));
						socket.emit("registerDone", userInfo);
						
					});
					
				});

			});
		})
	});
	

}

function update(obj){
	
	
	var userQuery = `UPDATE users SET coin = ${obj.coin}, end_time = ${obj.endTime}, raid_cnt = ${obj.raidCnt}, raid_damage = ${obj.raidDamage} WHERE kakao_id='${obj.user_id}'`;
	var skills = obj.poke.skills;
	var pokemonQuery = `UPDATE pokemon SET level = ${obj.poke.level}, exp = ${obj.poke.exp}, skills = JSON_MERGE_PATCH(skills, '${JSON.stringify(skills)}'), number = ${obj.poke.number} WHERE id='${obj.poke.id}'`;

	connection.query(userQuery);
	connection.query(pokemonQuery);
}


// 유저가 kakao id를 보낼 때
function login(user_id, socket){
	
  	var loginResult = {};
  	var userInfo = {};
  	var pokemonInfo = {};
  	var pokemon_id;
	  
     
     connection.query(`SELECT * from users WHERE kakao_id='${user_id}'`,
     (_, userRow, __) => {
       
        if(userRow.length > 0){
		  socket.kakao_id = userRow[0].kakao_id;
		  userInfo["user_id"] = userRow[0].kakao_id;
          userInfo["coin"] = userRow[0].coin;
		  userInfo["name"] = userRow[0].name;
			userInfo["guild"] = userRow[0].guild;
		  userInfo["end_time"] = userRow[0].end_time;
			userInfo["raid_cnt"] = userRow[0].raid_cnt;
			userInfo["raid_damage"] = userRow[0].raid_damage;
          pokemon_id = userRow[0].pokemon_id;
        
          connection.query(`SELECT * from pokemon WHERE id='${pokemon_id}'`, 
          (_, pkmRow, __) => {

			pokemonInfo["id"] = pkmRow[0].id;
            pokemonInfo["level"] = pkmRow[0].level;
            pokemonInfo["number"] = pkmRow[0].number;
            pokemonInfo["exp"] = pkmRow[0].exp;
			pokemonInfo["guild"] = pkmRow[0].class;

            var skills = JSON.parse(pkmRow[0].skills)
            var skillInfoes = []

            connection.query(`SELECT * from skills WHERE id IN(${skills.map(x => `'${x.id}'`).join(', ')})`,
            (_, skillRow, __) => {

              skillRow.forEach((elem, idx) => {
                skillInfo = {}
				skillInfo["id"] = elem.id;
                skillInfo["name"] = elem.name;
                skillInfo["cool"] = elem.cool;
                skillInfo["power"] = elem.power;
                skillInfo["level"] = skills[idx].level;
                skillInfoes.push(skillInfo);
              });

              pokemonInfo["skills"] = skillInfoes;
              userInfo["pokemon"] = pokemonInfo;
				
			  socket.emit("userInfo", userInfo);
            });
          });
        } else{
			socket.emit("register", {"user_id": user_id});
		}

	});
}
