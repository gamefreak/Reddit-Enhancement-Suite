{

	function extend(clazz, superClass, iMethods, cMethods) {
		function makeProps(methods) {
			if (!methods) return {};
			var properties = {};
			Object.keys(methods).forEach(function(name) {
				properties[name] = {
					value: methods[name],
					enumerable: false
				};
			});
			return properties;
		}

		clazz.prototype = Object.create(superClass.prototype)
 
		Object.defineProperties(clazz.prototype, makeProps(iMethods));
		Object.defineProperties(clazz, makeProps(cMethods));
		Object.defineProperty(clazz.prototype, "constructor", {
			value: clazz,
			enumerable: false
		});
	}


	function compare(operator, left, right) {
		switch (operator) {
			case "<":
			case "less than":
				return left < right;
			case "<=":
			case "at most":
				return left <= right;
			case "equal to":
			case "=":
				return left == right;
			case ">=":
			case "at least":
				return left >= right;
			case ">":
			case "more than":
				return left > right;
			case "!=": return left != right;
		}
	}


	function Post(post) {
		this.post = post;
	}
	extend(Post, Object, {
		author: function() {
			if (this._author) return this._author;

			this._author = this.post.querySelector('.author').href
				.match(/\/(?:u|user)\/([\w-]+)/)[1];
			return this._author
		},
		subreddit: function() {
			if (this._subreddit) return this._subreddit;

			this._subreddit = this.post.querySelector('.subreddit').href.match(/\/r\/(\w+)/)[1];
			return this._subreddit;
		},
		score: function() {
			if (this._score) return this._score;

			var midcol = this.post.querySelector(".midcol");
			var score = parseInt(midcol.querySelector(".score.unvoted"), 10);
			if (midcol.classList.contains("likes")) {
				this._score = score + 1;
			} else if (midcol.classList.contains("dislikes")) {
				this._score = score - 1;
			} else {
				this._score = score;
			}

			return this._score;
		}
	})



	function OrExpression(left, right) {
		this.left = left;
		this.right = right;
	}
	extend(OrExpression, Object, {
		evaluate: function(post) {
			if (this.left.evaluate(post)) return true;
			return this.right.evaluate(post);
		},
		toString: function() {
			return "(OR "+this.left+" "+this.right+")";
		}
	});





	function AndExpression(left, right) {
		this.left = left;
		this.right = right;
	}
	extend(AndExpression, Object, {
		evaluate: function(post) {
			if (!this.left.evaluate(post)) return false;
			return this.right.evaluate(post);
		},
		toString: function() {
			return "(AND "+this.left+" "+this.right+")";
		}
	});





	function NotExpression(expr) {
		this.expr = expr;
	}
	extend(NotExpression, Object, {
		evaluate: function(post) {
			return !this.expr.evaluate(post);
		},
		toString: function() {
			return "(NOT "+this.expr+")";
		}
	});






	function SubredditPredicate(pattern) {
		this.pattern = new Glob(pattern);
	}
	extend(SubredditPredicate, Object, {
		evaluate: function(post) {
			return this.pattern.test(post.subreddit());
		},
		toString: function() {
			return "(author matches /r/"+this.pattern+")";
		}
	});






	function AuthorPredicate(pattern) {
		this.pattern = new Glob(pattern);
	}
	extend(AuthorPredicate, Object, {
		evaluate: function(post) {
			return this.pattern.test(post.author());
		},
		toString: function() {
			return "(author matches /u/"+this.pattern+")";
		}
	});






	function ScorePredicate(operator, targetScore) {
		this.operator = operator;
		this.targetScore = targetScore;
	}
	extend(ScorePredicate, Object, {
		evaluate: function(post) {
			return compare(this.operator, post.score(), this.targetScore);
		},
		toString: function() {
			return "(score "+this.operator+" "+this.targetScore+")";
		}
	});
}









start = expression


//Stuff
_ = [ \t\n\r]

named_comparison_operator = $(
	"at"i _+ ("least"i/"most"i)
	/ ("more"i/"less"i) _+ "than"i
	/ "equal"i _+ "to"i
) {return text.toLowerCase().replace(/\s+/g, " ")}

symbolic_comparison_operator = $("!"?"="[<>]"="?)

integer 'integer' = $("0"/[1-9][0-9]*) {return parseInt(text(), 10)}
signed_integer 'signed integer'
= $("0"/"-"?[1-9][0-9]*) {return parseInt(text(), 10)}

glob 'glob' = $("*" ! "*"/[a-z0-9_-]i+)+


///////////////
// Structure //
///////////////

expression = or_expression

or_expression
= left:and_expression _+ "OR"i _+ right:or_expression
	{return new OrExpression(left, right)}
/ and_expression

and_expression
= left:predicate _+ "AND"i _+ right:and_expression
	{return new AndExpression(left, right)}
/ predicate


predicate
= "(" _* expression:expression _* ")" {return expression}
/ "NOT" _+ predicate:predicate {return new NotExpression(predicate)}
/ subreddit_predicate
/ author_predicate
/ score_predicate






////////////////
// Predicates //
////////////////

subreddit_predicate "subreddit IS /r/name"
= "subreddit"i _+ "IS"i _+ "/r/" glob:glob {
	return new SubredditPredicate(glob);
}





author_predicate "author IS /u/name"
= "author"i _+ "IS"i _+ "/u/" glob:glob {
	return new AuthorPredicate(glob);
}





score_predicate "score IS [at least|at most|more than|less than|equal_to] number" 
= "score"i _+ "IS"i _+ op:named_comparison_operator _+ number:signed_integer {
	return new ScorePredicate(op, number);
}
