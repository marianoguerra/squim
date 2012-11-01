/* description: Parses the squim language. */

/* lexical grammar */
%lex
%%

";".*\n+               /* ignore */
";".*$                 /* ignore */
\s+                    /* skip whitespace */
"."                    return 'DOT'
[\-\+]?[0-9]+"."[0-9]+\b  return 'DECIMAL'
[\-\+]?[0-9]+\b           return 'INTEGER'
[\-\+]?"#"[bodx][0-9a-zA-Z]+\b           return 'BASEINTEGER'
"#t"                   return 'TRUE'
"#f"                   return 'FALSE'
"#inert"               return 'INERT'
"#ignore"              return 'IGNORE'
"\"".*?"\""            return 'STRING'
[A-Za-z0-9!\$%&\*\+\-/<=>\?@\^\_~]+     return 'SYMBOL'
"("                    return '('
")"                    return ')'
"{"                    return '{'
"}"                    return '}'
":"                    return ':'
<<EOF>>                return 'EOF'
.                      return 'INVALID'

/lex

%start expressions

%% /* language grammar */

expressions
    : e EOF
        { return $1; }
    ;

listItems: e                                                                   
        { $$ = new Types.Pair($1, Types.nil); }                                                         
    | e listItems
        { $$ = new Types.Pair($1, $2); }                                              
    ;  

objPairs: SYMBOL e
	{ 
		$$ = {};
		$$[$1] = $2;
	}
    | SYMBOL e objPairs
	{ 
		$3[$1] = $2;
		$$ = $3;
	}
    ;

obj :
      '{' '}'
    	{$$ = new Types.Obj();}
    | '{' objPairs '}'
    	{$$ = new Types.Obj($2, true);}
    ;

list :
    '(' ')'
        {$$ = Types.nil;}
    | '(' listItems DOT e ')'
        {
            var pair = $2;

            while (pair.right !== Types.Pair.nil) {
                pair = pair.right;
            }

            pair.right = $4;

            $$ = $2;
        }
    | '(' listItems ')'
        {$$ = $2;}
    ;


literal :
      list
      {$$ = $1;}
    | obj
      {$$ = $1;}
    | INTEGER
        {$$ = new Types.Int(parseInt(yytext, 10));}
    | DECIMAL
    	{$$ = new Types.Float(parseFloat(yytext));}
    | BASEINTEGER
      {
        var str, sign = yytext.charAt(0), baseChar, base;

        if (sign === "+" || sign === "-") {
          str = yytext.slice(3);
          baseChar = yytext.charAt(2);
        } else {
          sign = "+";
          str = yytext.slice(2);
          baseChar = yytext.charAt(1);
        }

        switch (baseChar) {
        case 'b': base = 2; break;
        case 'o': base = 8; break;
        case 'd': base = 10; break;
        case 'x': base = 16; break;
        default: throw "invalid base: " + baseChar;
        }

        $$ = new Types.Int(parseInt(sign + str, base));
      }
    | STRING
    	{$$ = new Types.Str(yytext.slice(1, yytext.length - 1));}
    | SYMBOL
    	{$$ = new Types.Symbol(yytext);}
    | TRUE
        {$$ = Types.t;}
    | FALSE
        {$$ = Types.f;}
    | INERT
        {$$ = Types.inert;}
    | IGNORE
        {$$ = Types.ignore;}
    ;

e :
      literal ':' obj
    	{ $1.meta = $3.attrs; }
    | literal
    ;


