/**
 * COSheetHelper : COC & COG sheets helper functions
 * Version : 1.4.0
 * Last updated : 2023-12-27
 * Usage :
 * !cosh <function> <arguments>
 * See documentation @ https://github.com/stephaned68/COCGSheetHelper#readme
 */

/**
 * @typedef {Object} Roll20Character
 * @property {string}   _id                   A unique ID for this object. Globally unique across all objects in this game. Read-only.
 * @property {string}   _type                 "character"	Can be used to identify the object type or search for the object. Read-only.
 * @property {string}   avatar                URL to an image used for the character. See the note about avatar and imgsrc restrictions below.
 * @property {string}   name                  Character name
 * @property {string}   bio                   Character bio
 * @property {string}   gmnotes               Notes on the character only viewable by the GM
 * @property {boolean}  archived
 * @property {string}   inplayerjournals      Comma-delimited list of player IDs ("all" for all players)
 * @property {string}   controlledby          Comma-delimited list of player IDs able to control and edit ("all" for all players)
 * @property {string}   _defaulttoken         A JSON string that contains the data for the Character's default token if one is set. Read-only.
 */

var COSH =
  COSH ||
  (function () {
    const stateKey = "COSH";
    const modName = `Mod:${stateKey}`;
    const modVersion = "1.40";
    const modCmd = "!cosh";
    const modHelpHandout = "Mod-COSheet-Help";

    const modState = {
      version: modVersion,
      universe: "COG",
      whisper: false,
      logging: false,
      hasCOGCrew: false,
      hasChatSetAttr: false,
      hasTokenMod: false,
      tokenBars: { }
    };

    /**
     * HTML helper functions
     */
    const htmlHelper = {
      /**
       * Return a string of style definitions
       * @param {object} list key-value pairs
       * @returns {string} style property
       */
      getStyle: function (list) {
        let style = "";
        for (const prop in list) {
          style +=
            prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() +
            ":" +
            list[prop] +
            ";";
        }
        return style;
      },

      /**
       * Return an HTML element string
       * @param {string} tag HTML element tag
       * @param {string} content HTML element content
       * @param {object} attributes key-value pairs of attributes
       * @returns {string} HTML element
       */
      getElement: function (tag, content, attributes = {}) {
        let html = `<${tag}`;
        for (const [prop, value] of Object.entries(attributes)) {
          html += ` ${prop
            .replace(/([a-z])([A-Z])/g, "$1-$2")
            .toLowerCase()}="${value}"`;
        }
        if (content === null) html += " />";
        else html += `>${content}</${tag}>`;
        return html;
      },

      /**
       * Return a string with HTML elements siblings
       * @param {array} elements list of HTML elements to create
       * @returns {string} HTML elements
       */
      getElements: function (elements) {
        let html = "";
        if (Array.isArray(elements)) {
          elements.forEach((element) => {
            html += htmlElement(
              element.tag,
              element.content || null,
              element.attributes || {}
            );
          });
        }
        return html;
      },
    };

    const buttonClasses = {
      transparent: {
          border: "none",
          borderRadius: "3px",
          backgroundColor: "transparent",
          padding: "3px",
          margin: "2px",
          color: "#3452eb",
          fontSize: "1em",
          fontWeight: "bold",
        },
      flat: {
          border: "none",
          borderRadius: "3px",
          backgroundColor: "#3452eb",
          padding: "3px",
          margin: "2px",
          color: "#fff",
          fontSize: "1em",
          fontWeight: "bold",
        }
    };

    function buttonStyle(className) {
      return `style="${ htmlHelper.getStyle(buttonClasses[className]) }`;
    }

    /**
     * Log a message to the debug console
     * @param {string} msg
     * @param {boolean} force
     */
    function writeLog(msg, force = true) {
      if (state[stateKey].logging || force) {
        if (typeof msg != "object") {
          log(`${modName} | ${msg}`);
        } else {
          for (const [prop, value] of Object.entries(msg)) {
            log(`${modName} | ${prop} = ${value}`);
          }
        }
      }
    }

    /**
     * Send a message to chat
     * @param {string} message 
     * @param {string} speakAs 
     */
    function writeChat(message, speakAs = modName) {
      sendChat(speakAs, message, null, { noarchive: true });
    }

    /**
     * Return a date-time ISO string
     * @returns string
     */
    function dateTimeStamp() {
      const dt = new Date(Date.now()).toISOString();
      return dt.split("T")[0] + " @ " + dt.split("T")[1].split(".")[0];
    }

    /**
     * Check if universe matches settings
     * @param {string} setting 
     * @returns {boolean}
     */
    function universe(setting) {
      return (state[stateKey].universe === setting);
    }

    const ABILITIES = {
      COC: {
        pj: [ "FORCE::FOR", "DEXTERITE::DEX", "CONSTITUTION::CON", "INTELLIGENCE::INT", "PERCEPTION::PER", "CHARISME::CHA" ],
        pnj: [ "pnj_for::FOR", "pnj_dex::DEX", "pnj_con::CON", "pnj_int::INT", "pnj_per::PER", "pnj_cha::CHA" ],
        vehicule: []
      },
      COG: {
        pj: [ "FOR_TEST::FOR", "DEX_TEST::DEX", "CON_TEST::CON", "INT_TEST::INT", "PER_TEST::PER", "CHA_TEST::CHA" ],
        pnj: [ "pnj_for::FOR", "pnj_dex::DEX", "pnj_con::CON", "pnj_int::INT", "pnj_per::PER", "pnj_cha::CHA" ],
        vaisseau: [ "FOR_TEST::PUI", "DEX_TEST::MAN", "CON_TEST::COQ", "INT_TEST::ORD", "PER_TEST::SEN", "CHA_TEST::COM" ],
        mecha: [ "mec_for::FOR", "mec_dex::DEX", "mec_con::CON", "mec_int::INT", "mec_per::PER", "mec_cha::CHA" ]
      }
    }

    const TOKENBARS = {
      COC: {
        pj: [ "", "DEF", "PV:max" ],
        pnj: [ "", "pnj_def", "pnj_pv:max" ],
        vehicule: [ "", "DEFV", "PVV:max" ],
      },
      COG: {
        pj: [ "DEP", "DEF", "PV:max" ],
        pnj: [ "", "pnj_def", "pnj_pv:max" ],
        vaisseau: [ "DEFSOL", "DEFRAP", "PV:max" ],
        mecha: [ "mec_defsol", "mec_defrap", "mec_pv:max" ]
      }
    }

    const ROLLS = {
      pj: [ "jet_for", "jet_dex", "jet_con", "jet_int", "jet_per", "jet_cha" ],
      pnj: [ "pnj_for", "pnj_dex", "pnj_con", "pnj_int", "pnj_per", "pnj_cha" ],
    };

    const MACROS = [ 
      { name: "cosh-voies",   action: "!cosh actions --voies" },
      { name: "cosh-capas",  action: "!cosh actions --competences" }, 
      { name: "cosh-attaques",    action: "!cosh actions --attaques" }, 
      { name: "cosh-caracs",   action: "!cosh actions --caracs" }, 
      { name: "cosh-create",  action: coshCreateAction } 
    ];

    const HELP_CONTENT = `
    <h1>COSheet MOD script v${modVersion}</h1>
    <p>par stephaned68</p>
    <hr>
    <h2>Commandes</h2>
    <p>Ces commandes nécessitent qu'un jeton représentant un personnage soit sélectionné.</p>
    <code>!cosh actions --attaques</code>
    <p>Affiche un menu de chat avec la liste des attaques/armes.</p>
    <code>!cosh actions --voies</code>
    <p>Affiche un menu de chat avec la liste des voies.</p>
    <code>!cosh actions --voie #</code>
    <p>Affiche un menu de chat avec la liste des capacités de la voie no #.</p>
    <code>!cosh actions --competences</code>
    <p>Affiche un menu de chat avec la liste des jets de capacités.</p>
    <code>!cosh gm:bars --mook</code>
    <p>Lie les barres du token sélectionné aux attributs de la fiche de personnage<br>
    Si l'option <code>--mook</code> est indiquée, les valeurs courante et maximum de PV sont liées, mais pas l'attribut
    </p>
    <code>!cosh gm:create pj|pnj|vehicule|vaisseau|mecha nomDuPersonnage</code>
    <p>Crée une fiche de personnage du type indiqué et le lie au token sélectionné</p>
    <code>!cosh gm:sheet</code>
    <p>Affiche un "stat-block" synthétique des attributs du personnage.</p>
    <code>!cosh token --set:+xxx,+yyyy,-zzzz</code>
    <ul>
      <li>Active les marqueurs de jeton préfixés par + </li>
      <li>Désactive les marqueurs de jeton préfixés par - </li>
    </ul>
    <p>Chaque marqueur peut être suffixé par =n (où 1 &le; n &le; 9) pour ajouter un badge numérique au marqueur</p>
    <code>!cosh stats</code>
    <p>Affiche un tirage de caractéristiques dans le chat.</p>
    <hr>
    <h2>Création rapide de tokens / mooks</h2>
    <p>Le toolkit du MJ vous permet de créer rapidement et facilement des fiches de personnage et les associer aux tokens</p>
    <ul>
    <li>Fabriquez le token avec votre outil préféré et déposez le sur la page Roll20</li>
    <li>Sélectionnez le token et tapez la commande <code>!cosh gm:create</code> suivi du type de fiche (<code>pj</code>, <code>pnj</code>, etc...) et du nom du personnage<br>
    La fiche est créée et elle est liée au token via le champ "Représente"
    </li>
    <li>Mettez à jour la fiche à votre guise : manuellement, via un import de statblock depuis le PDF du jeu, ou via un blob JSON récupéré sur <a href="https://comob-data.rpgapps.net/">Chroniques Mobiles</a></li>
    <li>Sélectionner le token et tapez la commande <code>!cosh gm:bars</code><br>
    Les barres du token sont liés aux attributs de la fiche de personnage :
    <ul>
    <li>La barre 1 (verte) dépend du type de fiche</li>
    <li>La barre 2 (bleue) est liée à la DEF</li>
    <li>La barre 3 (rouge) est liée aux PV max</li>
    </ul>
    Si la fiche est un PNJ ou que vous indiquez l'option <code>--mook</code>, les valeurs de PV sont liées mais pas l'attribut.<br>
    L'attribut qui représente les PV est détecté par la présence de ':max' dans son nom.
    </li>
    </ul>
    `;

    /**
     * Return the chat string for a character's attribute
     * @param {string} char character name
     * @param {string} attr attribute name
     * @returns {string} chat string
     */
    function charAttr(char, attr) {
      return `@{${char}|${attr}}`;
    }

    /**
     * Return the full name for a repeating section attribute
     * @param {string} section
     * @param {number|string} index
     * @param {string} attr
     * @returns {string} repeating attribute
     */
    function repeatAttr(section, index, attr) {
      if (!attr) return "";
      const repeatSection = `repeating_${section}`;
      if (isNaN(index)) return `${repeatSection}_${index}_${attr}`;
      else return `${repeatSection}_$${index}_${attr}`;
    }

    /**
     * @typedef RepeatValueOptions
     * @property {string} charId
     * @property {string} section
     * @property {string|number} index
     * @property {string} attr
     */

    /**
     * Return a repeating section attribute value
     * @param {RepeatValueOptions} options 
     * @returns {string}
     */
    function repeatValue(options) {
      let value = "";
      const { charId, section, index, attr } = options;
      const repeatName = repeatAttr(section, index, attr);
      if (repeatName) {
        value = getAttrByName(charId, repeatName);
      }
      return value;
    }

    /**
     * Return all the row ids for a given section
     * @param {string} charId
     * @param {string} section
     * @returns {string[]} row ids for section
     */
    function repeatRowIds(charId, section) {
      let rowIds = [];
      const attribs = findObjs({
        _type: "attribute",
        _characterid: charId,
      });
      for (const attrib of attribs) {
        const attrName = attrib.get("name");
        if (attrName.startsWith(`repeating_${section}_`)) {
          const [ repeating, repSection, rowId ] = attrName.split("_");
          if (rowIds.indexOf(rowId) === -1) rowIds.push(rowId);
        }
      }
      return rowIds;
    }

    /**
     * Return token object for id
     * @param {string} id Token unique identifier
     * @returns {object} token object
     */
    function getToken(id) {
      return getObj("graphic", id);
    }

    /**
     * Return selected tokens as an array of objects
     * @param {object} msg Chat message object
     * @returns {object[]} selected tokens
     */
    function getTokens(msg) {
      const tokens = [];
      if (msg.selected) {
        msg.selected.forEach((token) => {
          tokens.push(getToken(token._id));
        });
      }
      return tokens;
    }

    /**
     * Return character object for id
     * @param {string} id Character unique identifier
     * @returns {object|null} character object or null
     */
    function getCharacter(id) {
      if (id) {
        return getObj("character", id);
      } else {
        return null;
      }
    }

    /**
     * Return character object from token
     * @param {object} token Token object
     * @returns {object|null} character object or null
     */
    function getCharacterFromToken(token) {
      if (token) {
        return getObj("character", token.get("represents"));
      } else {
        return null;
      }
    }

    /**
     * Return character id from --charid= command line arguments
     * @param {string[]} args Chat command arguments
     * @returns {string} character id
     */
    function getCharacterId(args) {
      let charId = null;
      args.forEach((arg) => {
        if (arg.toLowerCase().startsWith("--charid=")) {
          charId = arg.split("=")[1] || "";
          if (charId !== "") {
            if (charId.startsWith("'") || charId.startsWith('"')) {
              charId = eval(charId);
            }
          }
        }
      });
      return charId;
    }

    /**
     * Output the whisper command
     * (based on sheet and general configuration)
     * @param {string} toGM
     * @param {string} charName
     * @returns {string} whisper command
     */
    function whisper(toGM, charName) {
      let w = toGM;
      if (w == "" && state[stateKey].whisper) {
        w = `/w "${charName}" `;
      }
      return w;
    }

    const ATTRIBUTE_NAMES = {
      COC: {
        pj: {
          togm: "togm",
          atkRpt: "armes",
          atkName: "armenom",
          atkRoll: "pjatk",
          atkType: "armeatk",
          atkPortee: "armeportee",
          capaRpt: "jetcapas",
          capaName: "jetcapanom",
          capaSkill: "jetcapatitre",
          capaRoll: "pjcapa",
          traitRpt: "traits",
          traitName: "traitnom",
          traitRoll: "pjtrait",
        },
        pnj: {
          togm: "pnj_togm",
          atkRpt: "pnjatk",
          atkName: "atknom",
          atkRoll: "pnjatk",
          capaRpt: "pnjcapas",
          capaName: "capanom",
          capaRoll: "pnjcapa",
        },
        vehicule: {
          togm: "togm",
          capaRpt: "jetv",
          capaName: "jetvnom",
          capaRoll: "vehicule",
        },
      },
      COG: {
        pj: {
          togm: "togm",
          atkRpt: "armes",
          atkName: "armenom",
          atkRoll: "pjatk",
          atkType: "armeatk",
          atkPortee: "armeportee",
          capaRpt: "jetcapas",
          capaName: "jetcapanom",
          capaSkill: "jetcapatitre",
          capaRoll: "pjcapa",
          traitRpt: "traits",
          traitName: "traitnom",
          traitRoll: "pjtrait",
        },
        pnj: {
          togm: "pnj_togm",
          atkRpt: "pnjatk",
          atkName: "atknom",
          atkRoll: "pnjatk",
          atkPortee: "atkportee",
          capaRpt: "pnjcapas",
          capaName: "capanom",
          capaRoll: "pnjcapa",
        },
        vaisseau: {
          togm: "togm",
          atkRpt: "armesv",
          atkName: "armenom",
          atkRoll: "vatk",
          atkType: "armeatk",
        },
        mecha: {
          togm: "mec_togm",
          atkRpt: "mecatk",
          atkName: "atknom",
          atkRoll: "mecatk",
          atkType: "atktype",
          atkPortee: "atkportee",
        }
      },
    };

    
    /**
     * @typedef {Object} AllPathsOptions
     * @property {string} charId
     * @property {string} charName
     * @property {string} attrs
     */

    /**
     * Return a chat menu for all paths
     * @param {AllPathsOptions} options 
     * @returns {string} 
     */
    function getAllPaths(options) {
      let allPathsMenu = "";
      const { charId, charName, attrs } = options;

      const voies = [...Array(9).keys()].map(v => `voie${v+1}nom`);
      voies.forEach((voieAttr, voie) => {
        const voieNom = getAttrByName(charId, voieAttr);
        if (voieNom !== "") {
          allPathsMenu += `${voie + 1}. [${voieNom}](!cosh actions --voie ${
            voie + 1
          } --charId=${charId}" ${buttonStyle("flat")})\n\r`;
        }
      });

      if (allPathsMenu !== "") {
        allPathsMenu =
          whisper(attrs.togm, charName) +
          `&{template:co1} {{perso=${charAttr(
            charName,
            "character_name"
          )}}} {{subtags=${charAttr(
            charName,
            "PROFIL"
          )}}} {{name=Capacités}} {{desc=${allPathsMenu} }}`;
      }

      return allPathsMenu;
    }

    /**
     * @typedef {Object} OnePathOptions
     * @property {string} charId
     * @property {string} charName
     * @property {string} pathId
     * @property {string} attrs
     */

    /**
     * Return a chat menu for all possessed abilties in a path
     * @param {OnePathOptions} options 
     * @returns {string}
     */

    function getOnePath(options) {
      let onePathMenu = "";
      const { charId, charName, pathId, attrs } = options;

      const voie = `voie${pathId}-`;
      const rangs = [...Array(5).keys()].map(r => `${voie}${r+1}`);
      rangs.forEach((rangAttr, rang) => {
        const vnrn = rangAttr.replace("voie", "v").replace("-", "r");
        // check if character has ability
        const hasAbility = getAttrByName(
          charId,
          vnrn
        ) || "0";
        if (hasAbility !== "1") return;
        // get ability title
        let rangTitle = getAttrByName(
          charId,
          rangAttr.replace("-", "-t")
        ) || "";
        let rangDesc = getAttrByName(charId, rangAttr);
        // parse from description if no title found
        if (rangTitle === "" && rangDesc.indexOf("\n") !== -1) {
          [ rangTitle ] = rangDesc.split("\n");
          rangDesc = rangDesc.split("\n").slice(1).join("\n");
        }
        const buttonDesc = `[${rangTitle}](~${charId}|${vnrn}" ${buttonStyle("flat")})`;
        let buttonAbility = "";
        const abilityRollId = repeatRowIds(charId, "jetcapas").find((id) => {
          return getAttrByName(charId, `repeating_jetcapas_${id}_jetcapavr`) === vnrn; 
        })
        if (abilityRollId) {
          buttonAbility = ` [🎲](~${charId}|repeating_jetcapas_${abilityRollId}_pjcapa" ${buttonStyle("flat")})`;
        }
        onePathMenu += `${rang+1}. ${buttonDesc} ${buttonAbility}\n\r`;
      });

      if (onePathMenu !== "") {
        onePathMenu =
          whisper(attrs.togm, charName) +
          `&{template:co1} {{perso=${charName}}} {{subtags=Capacités}} {{name=${charAttr(
            charName,
            `voie${pathId}nom`
          )}}} {{desc=${onePathMenu} }}`;
      }

      return onePathMenu;
    }


    /**
     * @typedef {Object} AllAbilityRollsOptions
     * @property {string} charId
     * @property {string} charName
     * @property {string} attrs
     */

    /**
     * Return a chat menu for all ability rolls
     * @param {AllAbilityRollsOptions} options 
     * @returns {string} Chat menu string 
     */
    function getAllAbilityRolls(options) {
      let allAbilityMenu = "";
      const { charId, charName, attrs } = options;
      
      rowIds = repeatRowIds(charId, attrs.capaRpt);
      if (rowIds.length > 0) {
        rowIds.forEach((rowId) => {
          let buttonLabel = repeatValue({ 
            charId, 
            section: attrs.capaRpt, 
            index: rowId, 
            attr: attrs.capaSkill
          });
          if (buttonLabel === "") {
            buttonLabel = repeatValue({
              charId,
              section: attrs.capaRpt, 
              index: rowId, 
              attr: attrs.capaName
            });
          }
          if (buttonLabel) {
            allAbilityMenu +=
              `[${buttonLabel}](~${charId}|${repeatAttr(
                attrs.capaRpt,
                rowId,
                attrs.capaRoll
              )}" ${buttonStyle("flat")})` +
              "\n\r";
          }
        });

        if (allAbilityMenu !== "") {
          allAbilityMenu =
            whisper(attrs.togm, charName) +
            `&{template:co1} {{perso=${charName}}} {{subtags=${charAttr(
              charName,
              "PROFIL"
            )}}} {{name=Compétences}} {{desc=${allAbilityMenu} }}`;
        }
      }

      return allAbilityMenu;
    }

    /**
     * @typedef {Object} AllAttackRolls
     * @property {string} charId
     * @property {string} charName
     * @property {string} attrs
     * @property {string} fiche 
     */

    /**
     * Return a chat menu for all attack rolls
     * @param {AllAttackRolls} options 
     * @returns 
     */
    function getAllAttackRolls(options) {
      let allAttackRolls = "";
      const { charId, charName, attrs, fiche } = options;

      rowIds = repeatRowIds(charId, attrs.atkRpt);
      if (rowIds.length > 0) {
        for (let arme = 0; arme < rowIds.length; arme++) {
          const armeNom = repeatValue({
            charId,
            section: attrs.atkRpt, 
            index: rowIds[arme], 
            attr: attrs.atkName
          });
          let atkNom = "";
          if (fiche === "pj" || fiche === "vaisseau") {
            atkNom = repeatValue({
              charId,
              section: attrs.atkRpt, 
              index: rowIds[arme], 
              attr: "armejetn"
            });
          }
          let atkInfo = "";
          atkInfo += atkNom !== "" ? " " + atkNom : "";
          let atkType = "";
          if (attrs.atkType) {
            atkType = repeatValue({
              charId,
              section: attrs.atkRpt, 
              index: rowIds[arme], 
              attr: attrs.atkType
            });
          }
          if (fiche !== "vaisseau") {                
            let limitee = "";
            if (fiche === "pj")
              limitee = repeatValue({
                charId,
                section: attrs.atkRpt, 
                index: rowIds[arme], 
                attr: "armelim"
              });
            if (limitee !== "") atkInfo += " " + limitee;
            let portee = "";
            if (fiche !== "vaisseau")
              portee = repeatValue({
                charId,
                section: attrs.atkRpt, 
                index: rowIds[arme], 
                attr: attrs.atkPortee
              });
            if (portee !== "") {
              if (atkType === "@{ATKTIR}") atkInfo += " (Tir:";
              if (atkType === "@{ATKMAG}") atkInfo += " (Mag:";
              if (atkType === "@{ATKMEN}") atkInfo += " (Men:";
              if (
                atkType === "@{ATKPSYINFLU}" ||
                atkType === "@{ATKPSYINTUI}"
              )
                atkInfo += " (Psy:";
              if (fiche !== "pj") atkInfo += "(P:";
              atkInfo += portee + ")";
            } else {
              if (fiche !== "pnj") {
                if (atkType === "@{ATKMAG}") {
                  atkInfo += " (Mag)";
                } else if (atkType === "@{ATKMEN}") {
                  atkInfo += " (Men)";
                } else if (
                  atkType === "@{ATKPSYINFLU}" ||
                  atkType === "@{ATKPSYINTUI}"
                ) {
                  atkInfo += " (Psy)";
                } else {
                  atkInfo += " (CaC)";
                }
              }
            }
          }
          if (armeNom !== "") {
            allAttackRolls += `[${armeNom}](~${charId}|${repeatAttr(
              attrs.atkRpt,
              rowIds[arme],
              attrs.atkRoll
            )}" ${buttonStyle("flat")}) ${atkInfo}\n\r`;
          }
        }
        if (allAttackRolls !== "") {
          allAttackRolls =
            whisper(attrs.togm, charName) +
            `&{template:co1} {{perso=${charName}}} {{subtags=Combat}} {{name=Attaques}} {{desc=${allAttackRolls} }}`;
        }
      }

      return allAttackRolls;
    }

    /**
     * @typedef {Object} CaracRolls
     * @property {string} charId
     * @property {string} charName
     * @property {string} attrs
     * @property {string} fiche 
     */

    /**
     * Return a chat menu for carac rolls
     * @param {CaracRolls} options 
     * @returns {string}
     */
    function getCaracRolls(options) {
      let caracRolls = "";
      const { charId, charName, attrs, fiche } = options;

      const msgItems = [];
      ROLLS[fiche].forEach((roll) => {
        const carac = roll.split("_")[1].toUpperCase();
        msgItems.push(`[${carac}](~${charId}|${roll}" ${buttonStyle("flat")})`);
      });
      caracRolls = msgItems.join(" | ");
      caracRolls =
        whisper(attrs.togm, charName) +
        `&{template:co1} @{${charName}|token_dsp} {{perso=${charName}}} {{subtags=Tests}} {{name=Caractéristiques}} {{desc=${caracRolls} }}`;

      return caracRolls;
    }

    /**
     * Output a list of actions to the chat
     * @param {string} charId Character Id
     * @param {string[]} args Chat command arguments
     */
    function displayActions(charId, args) {
      const charName  = getAttrByName(charId, "character_name");
      const fiche     = getAttrByName(charId, "type_personnage");
      const attrs     = ATTRIBUTE_NAMES[state[stateKey].universe][fiche];
      const [ menuType, pathId ] = args;

      let chatMsg = "";

      switch (menuType) {
        // !cosh actions --voies : liste des voies
        case "--voies":
          if (fiche === "pj") chatMsg = getAllPaths({ charId, charName, attrs });
          break;

        // !cosh actions --voie # : liste des capacités voie #
        case "--voie":
          if (fiche === "pj") chatMsg = getOnePath({ charId, charName, pathId, attrs });
          break;

        // !cosh actions --competences
        case "--competences":
          if (attrs.capaRpt === "") break;
          chatMsg = getAllAbilityRolls({ charId, charName, attrs });
          break;

        // !cosh actions --caracs
        case "--caracs":
          chatMsg = getCaracRolls({ charId, charName, attrs, fiche });
          break;

        // !cosh actions --attaques
        case "--attaques":
          if (attrs.atkRpt === "") break;
          chatMsg = getAllAttackRolls({ charId, charName, attrs, fiche });
          break;

        default:
          break;
      }
      if (chatMsg !== "") {
        //writeLog(chatMsg);
        writeChat(chatMsg, `character|${charId}`);
      }
    }

    /**
     * Find one or more attribute object(s)
     * @param {object} props Properties of the attribute to find
     * @returns {object[]}
     */
    function findAttribute(props) {
      const criteria = { _type: "attribute" };
      for (const prop in props) {
        criteria[prop] = props[prop];
      }
      return findObjs(criteria);
    }

    /**
     * Find a single attribute 
     * @param {object} props Properties of the attribute to find
     * @returns {object}
     */
    function findSingleAttribute(props) {
      const [ attribute ] = findAttribute(props)
      return attribute || null;
    }

    /**
     * Return an attribute value
     * @param {object} character character object
     * @param {string} name name of attribute
     * @param {string} valueType type of value current | max
     * @returns {string} value of attribute
     */
    function attributeValue(character, name, valueType = "current") {
      let value = "";
      const attribute = findSingleAttribute({ _characterid: character.get("_id"), name: name });
      if (attribute) value = attribute.get(valueType);
      return value;
    }

    /**
     * Update character attributes from token marker change
     * @param {object} characterObj Roll20 character object
     * @param {object} marker Token marker object
     */
    function setCharacterAttrs(characterObj, marker) {
      switch (marker.name) {
        case "dead":
          break;
        default:
          break;
      }
    }

    /**
     * Set legacy virtual properties for standard markers
     * @param {object} tokenObj Roll20 token object
     * @param {object} marker Token marker object
     */
    function setVirtual(tokenObj, marker) {
      const prop = `status_${marker.name}`;
      const state =
        marker.op === "-" ? false : marker.badge !== 0 ? marker.badge : true;
      tokenObj.set(prop, state);
    }

    /**
     * Apply token markers operation (add / remove)
     * @param {object} tokenObj Roll20 token object
     * @param {object} characterObj Roll20 character object
     * @param {object[]} markerOps List of marker operations objects
     */
    function setMarkers(tokenObj, characterObj, markerOps) {
      // standard markers
      const stdMarkers = "red,blue,green,brown,purple,pink,yellow,dead".split(
        ","
      );
      // game's custom markers
      const tokenMarkers = JSON.parse(Campaign().get("token_markers"));
      // token's markers
      let currentMarkers = tokenObj.get("statusmarkers").split(",");
      // loop through list of markers
      markerOps.forEach((marker) => {
        const isStdMarker = stdMarkers.indexOf(marker.name) !== -1;
        if (marker.op === "+") {
          // set
          let statusmarker = "";
          let tokenMarker = tokenMarkers.find((tm) => tm.name === marker.name);
          if (tokenMarker) {
            statusmarker = tokenMarker.tag;
          } else {
            if (isStdMarker) {
              statusmarker = marker.name;
              setVirtual(tokenObj, marker, true);
            }
          }
          statusmarker += marker.badge !== 0 ? `@${marker.badge}` : "";
          if (currentMarkers.length === 1 && currentMarkers[0] === "") {
            currentMarkers[0] = statusmarker;
          } else if (currentMarkers.indexOf(statusmarker) === -1) {
            currentMarkers.push(statusmarker);
          }
        }
        if (marker.op === "-") {
          // unset
          if (marker.name === "*") {
            currentMarkers.forEach((marker) => {
              if (isStdMarker) {
                setVirtual(tokenObj, marker, false);
              }
            });
            currentMarkers = [];
          } else {
            currentMarkers = tokenObj.get("statusmarkers").split(",");
            currentMarkers = currentMarkers.filter((tag) =>
              tag.startsWith(marker.tag)
            );
            if (isStdMarker) {
              setVirtual(tokenObj, marker, false);
            }
          }
        }
      });
      tokenObj.set({ statusmarkers: currentMarkers.join(",") });

      if (characterObj) {
        markerOps.forEach((marker) => {
          if (stdMarkers.indexOf(marker.name) === -1) {
            let find = {
              _type: "attribute",
              _characterid: characterObj._id,
              name: "",
            };
            let value = "";
            switch (marker.name) {
              case "affaibli":
                find.name = "ETATDE";
                value = marker.op === "+" ? "12" : "20";
                break;
              case "":
                break;
            }
            // find the attribute
            if (find.name) {
              const attrObj = findObjs(find)[0] || null;
              if (attrObj) {
                // set its value
                attrObj.set({ current: value });
              }
            }
          }
        });
      }
    }

    /**
     * Process token command
     * !cosh token +set:xxxx -set:xxxx
     *   sets the marker(s) specified in +set:
     *   unsets the marker(s) specified in -set:
     *   xxxx can be on or more status marker name(s), comma-delimited
     *   each marker can be suffixed with =n (where 1 < n <9) to add a badge to the marker
     * !cosh token --set:+xxx,+yyyy,-zzzz
     *   sets the markers prefixed with +
     *   unsets the markers prefixed with -
     *   same syntax as above for badges
     * @param {object} tokenObj Roll20 token object
     * @param {object} characterObj Roll20 character object
     * @param {string[]} args Chat command arguments
     */
    function tokenMarkers(tokenObj, characterObj, args) {
      let markerOps = [];
      for (const arg of args) {
        if (
          arg.toLowerCase().startsWith("+set:") ||
          arg.toLowerCase().startsWith("-set:")
        ) {
          const ops = arg.split(":");
          const markers = ops[1].split(",");
          markers.forEach((marker) => {
            const badge = parseInt(marker.split("=")[1]) || 0;
            marker = marker.split("=")[0];
            markerOps.push({ op: arg.slice(0, 1), name: marker, badge: badge });
          });
        }
        if (arg.toLowerCase().startsWith("--set:")) {
          const ops = arg.split(":");
          const markers = ops[1].split(",");
          markers.forEach((marker) => {
            markerOps.push({ op: marker.slice(0, 1), name: marker.slice(1) });
          });
        }
      }
      setMarkers(tokenObj, characterObj, markerOps);
    }

    /**
     * Link character sheet to token
     * @param {Roll20Character} character 
     * @param {object} token 
     * @returns {void}
     */
    function gmLinkToken(character, token) {
      character.set("avatar", token.get("imgsrc"));
      if (!token.get("represents")) {
        token.set("represents", character.get("id"));
      }
      if (!token.get("name")) {
        token.set("name", character.get("name"));
      }
      setDefaultTokenForCharacter(character, token);

      writeChat("/w GM Token linked to " + character.get("name"));
    }

    /**
     * Create a character sheet
     * @param {string[]} args 
     * @returns {object}
     */
    function gmCreateSheet(args) {
      const charType = args.shift() || "pj";
      if (state[stateKey].universe && !TOKENBARS[state[stateKey].universe][charType]) {
        writeChat(`/w GM Unknown character type ${charType}`);
        return;
      }

      const charName = args.join(" ");
      const charVisibility = charType === "pj" ? "all" : "";
      
      const character = createObj("character", {
        name: charName,
        archived: false,
        inplayerjournals: charVisibility,
        "controlledby": charVisibility
      });
      if (!character) {
        writeLog(`Unable to create ${chartype} sheet for ${charName}`);
        return;
      }

      const _characterid = character.get("id");

      [
        { name: "type_personnage", value: charType },
        { name: "type_fiche", value: charType },
      ].forEach(item => {
        createObj("attribute", {
          _characterid,
          name: item.name,
          current: item.value
        });
      });

      return character;

    }

    /**
     * Link token bars to character
     * @param {object} token 
     * @param {object} character 
     * @param {boolean} mook 
     */
    function gmLinkTokenBars(token, character, mook) {
      const charId = character.get("id");
      const charType = getAttrByName(charId,"type_personnage");
      mook = mook || (charType === "pnj");
      const universe = state[stateKey].universe;
      const tokenbars = TOKENBARS[universe][charType];
      let linkMsg = [];
      tokenbars.forEach((link, bar) => {
        if (!link) return;
        const barName = `bar${ bar + 1 }`;
        const [ attribute, max ] = link.split(":");
        if (max && mook) {
          value = getAttrByName(charId, attribute, "current");
          token.set(`${barName}_value`, value);
          maxValue = getAttrByName(charId, attribute, "max");
          token.set(`${barName}_max`, maxValue);
          linkMsg.push(barName + ": " + value + "/" + maxValue);
          return;
        }
        const [ linkedTo ] = findObjs({
          _type: "attribute",
          _characterid: charId,
          name: attribute
        });
        if (!linkedTo) return;
        linkMsg.push(barName + ": " + attribute);
        token.set(`${barName}_link`, linkedTo.get("id"));
      });

      writeChat("/w GM " + character.get("name") + " " + linkMsg.join(", "));

      gmLinkToken(character, token);
    }

    /**
     * Returns a list of attributes and values as HTML string
     * @param {Roll20Character} character Roll20 character object
     * @param {Array<string>} attributes List of attributes to retrieve
     * @returns {string} HTML string
     */
    function getStats(character, attributes) {
      let stats = [];

      attributes.forEach(stat => {
        let [ statName, statMax, statLabel ] = stat.split(":");
        if (!statMax || statMax === "") statMax = "current";
        if (!statLabel || statLabel === "") statLabel = statName;
        const [ attribute ] = findAttribute({ name: statName, _characterid: character.get("_id") });
        if (attribute) {
          let span = "";
          if (statMax === "current") {
            span += `${statLabel}&nbsp;:&nbsp;`
          }
          span += `<b>${ attribute.get(statMax) }</b>`
          const statSpan = htmlHelper.getElement(
            "span",
            span,
            {}
          );
          stats.push(statSpan)
        };
      });

      return stats;
    }

    /**
     * Whispers a summary sheet to GM
     * @param {Roll20Character} character Roll20 character object
     * @returns {void}
     */
    function gmSheet(character) {
      const type = attributeValue(character, "type_personnage") || "pj";

      let charName = character.get("name");
      if (type != "pj") charName += " (" + type +")";

      let content = htmlHelper.getElement(
        "div",
        charName,
        {
          style: htmlHelper.getStyle({ 
            backgroundColor: "darkgray", 
            color: "white", 
            textAlign: "center", 
            borderRadius: "4px",
          })
        }
      );

      const CARACS = JSON.parse(attributeValue(character,"CARACS"));

      const universe = state[stateKey].universe;

      const abilities = [ ...ABILITIES[universe][type] ];

      const rows = [];

      switch (universe) {
        
        case "COC":
          if (type === "vehicule") {
            rows.push(
              getStats(character, [ "FOV::FOR", "AGI" , "DEFV::DEF", "RDV::RD" ]).join(" ") + " " +
              getStats(character, [ "PVV::PV", "PVV:max" ]).join(" / ")
            );
            break;
          }

          // physical stats
          const phys = [ abilities[0], abilities[1], abilities[2] ];
          const physMod = phys.map(a => a.split(":")[2]);
          rows.push(getStats(character, phys).map((value, index) => {
            let buff = attributeValue(character, `${physMod[index]}_BUFF`);
            if (buff !== "" && buff !== "0") buff = "+" + buff;
            return value += ` (${CARACS[physMod[index]]}${buff})`;
          }).join(" "));
          
          //mental stats
          const ment = [ abilities[3], abilities[4], abilities[5] ];
          const mentMod = ment.map(a => a.split(":")[2]);
          rows.push(getStats(character, ment).map((value, index) => {
            let buff  = attributeValue(character, `${mentMod[index]}_BUFF`);
            if (buff !== "" && buff !== "0") buff = "+" + buff;
            return value += ` (${CARACS[mentMod[index]]}${buff})`;
          }).join(" "));
          break;
        
        case "COG":
          rows.push(getStats(character, abilities).join(" "));

          if (type === "vaisseau") {
            rows.push(
              getStats(character, [ "INITV::Init", "DEFRAP::DEFrap" , "DEFSOL::DEFsol" ]).join(" ") + " " +
              getStats(character, [ "PV", "PV:max" ]).join(" / ") + " " +
              "(" + getStats(character, [ "seuil_avarie::Av." ]).join("") + ")"
            );
          }

          if (type === "mecha") {
            rows.push(
              getStats(character, [ "mec_init::Init", "mec_defrap::DEFrap" , "mec_defsol::DEFsol" ]).join(" ") + " " +
              getStats(character, [ "mec_pv::PV", "mec_pv:max" ]).join(" / ")
            );
          }

          break;
      }

      if (type === "pj") {
        const combat = [ "INIT", "DEF", "RDS::RD" ];
        if (universe === "COG") combat.push("DEP");
        rows.push(
          getStats(character, combat).join(" ") + " " +
          getStats(character, [ "PV", "PV:max" ]).join(" / ") + " " +
          "(" + getStats(character, [ "SEUILBG::BG" ]).join("") + ")"
        );
      }

      if (type === "pnj") {
        const combat = [ "pnj_init::Init", "pnj_def::DEF", "pnj_rd::RD" ];
        if (universe === "COG") combat.push("pnj_dep::DEP");
        rows.push(
          getStats(character, combat).join(" ") + " " +
          getStats(character, [ "pnj_pv::PV", "pnj_pv:max" ]).join(" / ") + " " +
          "(" + getStats(character, [ "pnj_sbg::BG" ]).join("") + ")"
        );
      }

      rows.forEach(row => {
        content += htmlHelper.getElement(
          "div",
          row,
          {
            style: htmlHelper.getStyle({
              fontSize: "smaller",
              textAlign: "justify"
            })
          }
        );
      });

      const html = htmlHelper.getElement(
        "div",
        content,
        {
          style: htmlHelper.getStyle({ 
            border: "1px solid black",
            padding: "2px",
            borderRadius: "4px",
            boxShadow: "2px 2px 2px 1px rgba(0, 0, 0, 0.2)",
          })
        }
      )

      writeChat("/w gm " + html);
    }

    /**
     * Toggle tokens from gmlayer <=> objects layers
     * @param {object[]} selectedTokens 
     */
    function gmToggleLayer(selectedTokens) {
      selectedTokens.forEach(token => {
        let layer = token.get("layer");
        layer = (layer === "gmlayer") ? "objects" : "gmlayer";
        token.set("layer", layer);
      });
    }

    /**
     * Process stats roll command
     * !cosh stats value1 value2 value3
     *   Determine the six stats values from 2d6 rolls
     *   Each 2d6 roll value is added to 6 to yield one stat value
     *   and subtracted from 19 to yield another stat value
     * exemple of use :
     *   !cosh stats [[2d6]] [[2d6]] [[2d6]]
     * @param {string[]} args Chat command arguments
     */
    function rollStats(args) {
      let rollValues = [];
      for (const argv of args) {
        if (argv > 1 && argv < 13) rollValues.push(argv);
      }
      while (rollValues.length < 3) {
        rollValues.push(randomInteger(6) + randomInteger(6));
      }

      let statValues = [];
      for (const roll of rollValues) {
        statValues.push(roll + 6);
        statValues.push(19 - roll);
      }

      let chatMsg =
        "&{template:co1} {{subtags=Tirage}} {{name=Caractéristiques}} {{desc=";
      for (const stat of statValues) {
        chatMsg += `[[${stat}]] `;
      }
      chatMsg += "}}";
      writeChat(chatMsg);
    }

    /**
     * Callback function for the cosh-create action text
     * @returns {string} action : macro text
     */
    function coshCreateAction() {
      let action = "!cosh gm:create ?{Type ?|Personnage,pj|PNJ,pnj";
      if (universe("COG")) action+="|Vaisseau,vaisseau|Mécha,mecha}";
      else action+="|Véhicule,vehicule}";
      action += " ?{Nom ?}"
      return action;
    }

    /**
     * Create a macro
     * @param {string} playerId played id
     * @param {object} macro macro object representation
     * @returns {void}
     */
    function createMacro(playerId, macro) {
      let [ createMacro ] = findObjs({
        _type:	"macro",
        name: macro.name
      });

      // get action
      let action = "";
      if (typeof macro.action === "function") {
        action = macro.action();
      } else {
        action = macro.action;
      }
      if (!action) return;

      // create or update
      if (createMacro === undefined) {
        createMacro = createObj("macro", {
          playerid: playerId,
          name: macro.name,
          action: action,
          visibleto: "all",
          istokenaction: false
        });
      } else {
        createMacro.set("action", action);
      }
    }

    /**
     * Display script configuration
     * @returns {void}
     */
    function configDisplay() {
      let helpMsg = `/w gm &{template:default} {{name=Configuration ${modName} v${modVersion} }}`;
      const universe = state[stateKey].universe;
      helpMsg += ` {{Univers=*${universe}* `;
      if (universe === "COC") {
        helpMsg += "[COG](!cosh config --universe COG)";
      } else {
        helpMsg += "[COC](!cosh config --universe COC)";
      }
      helpMsg += "}}"
      const bubbles = [ "🟢", "🔵", "🔴" ];
      const tokenBars = state[stateKey].tokenBars[universe];
      for (const sheetType in tokenBars) {
        helpMsg += `{{Barres ${sheetType.toUpperCase()}=}}`;
        tokenBars[sheetType].forEach((attribute, index) => {
          if (!attribute) attribute = "-n/a-";
          const barNum = index + 1;
          helpMsg += `{{${sheetType.slice(0,3)} ${barNum}${bubbles[index]}: ${attribute}=[Changer](!cosh config --bar|${barNum} ${sheetType}|?{Attribut ${sheetType.toUpperCase()} Barre ${barNum}}) }}`;
        });
      };
      helpMsg += ` {{Msg privés=*${state[stateKey].whisper}* [Toggle](!cosh config --whisper)}}`;
      helpMsg += ` {{Logging=*${state[stateKey].logging}* [Toggle](!cosh config --log)}}`;
      helpMsg += ` {{Macros=[Création](!cosh config --macros)}}`;
      writeChat(helpMsg);
    }

    /**
     * Process configuration command
     * !cosh config [...]
     * @param {string[]} args Chat command arguments
     * @param {string} playerId 
     * @returns {void}
     */
    function configSetup(args, playerId) {
      const [ option, value ] = args;
      switch (option) {
        case "--universe":
          state[stateKey].universe = value.toUpperCase();
          break;
        case "--whisper":
          state[stateKey].whisper = !state[stateKey].whisper;
          break;
        case "--log":
          state[stateKey].logging = !state[stateKey].logging;
          break;
        case "--macros":
          MACROS.forEach(macro => createMacro(playerId, macro));
          break;
        case "--bar|1":
        case "--bar|2":
        case "--bar|3":
          const [ , barNum ] = option.split("|");
          const [ sheetType, attribute ] = value.split("|");
          const universe = state[stateKey].universe;
          state[stateKey].tokenBars[universe][sheetType][barNum - 1] = attribute;
          break;
        default:
          break;
      }
      configDisplay();
    }

    /**
     * Display script help
     * @returns {void}
     */
    function displayHelp(option) {
      let helpMsg = `/w gm &{template:default} {{name=Aide commandes ${modName} v${modVersion} }}`;

      const help = {
        general: [
          {
            command: "!cosh",
            description: "suivi de..." 
          },
          {
            command: "actions",
            description: "Pour afficher un menu de boutons d'action dans le chat",
          },
          {
            command: "config",
            description: "Pour configurer le script MOD"
          },
          {
            command: "debug",
            description: "Pour envoyer des données de debug à la console API",
          },
          {
            command: "gm:bars",
            description: "Pour lier les barres de token à la fiche de personnage",
          },
          {
            command: "gm:create",
            description: "Pour créer une fiche de personnage et la lier au token sélectionné"
          },
          {
            command: "gm:sheet",
            description: "Pour afficher dans le chat au MJ un stat-block résumé de la fiche",
          },
          {
            command: "stats",
            description: "Pour faire un tirage de caractéristiques"
          },
          {
            command: "token",
            description: "Pour ajouter/retirer des marqueurs au token"
          },
        ],
        actions: [
          {
            command: "!cosh actions ",
            description: "suivi de..." 
          },
          {
            command: "--attaques",
            description: "Pour afficher un menu de chat des attaques/armes"
          },
          {
            command: "--voies",
            description: "Pour afficher un menu de chat des voies"
          },
          {
            command: "--voie {n}",
            description: "Pour afficher un menu de chat des capacités de la voie no {n}"
          },
          {
            command: "--competences",
            description: "Pour afficher un menu de chat des jets de capacités"
          }
        ]
      };
      
      let helpList = help[option];
      if (!helpList) helpList = help.general;

      helpList.forEach((help) => {
        helpMsg += `{{${help.command}=${help.description} }}`;
      });
      writeChat(helpMsg);
    }

    /**
     * Migrate state schema to v1.40
     */
    function migrateToVersion1_40() {
      if (!state[stateKey].tokenBars) {
        state[stateKey].tokenBars = TOKENBARS;
      }
    }

    /**
     * Update state version / schema
     * @returns {void}
     */
    function migrateState() {
      const version = parseFloat(state[stateKey].version);

      if (version < 1.49) migrateToVersion1_40();
      
      state[stateKey].version = modVersion;
    }

    /**
     * Create the MOD script's help handout
     * @returns {void}
     */
    function helpHandout() {
      let [ helpHandout ] = findObjs({
        _type:	"handout",
        name: modHelpHandout
      });
      if (!helpHandout) {
        helpHandout = createObj("handout", {
          name: modHelpHandout,
        });
      }
      if (!helpHandout) return;

      helpHandout.get("gmnotes", function (gmNotes) {
        if (gmNotes === modVersion) return;

        helpHandout.set("notes", HELP_CONTENT);
        helpHandout.set("gmnotes", modVersion);
      });
    }

    /**
     * Check optional scripts dependencies
     * Check and update script state schema
     * Create help handout
     * @returns {void}
     */
    function checkInstall() {
      if (!state[stateKey] || !Object.keys(state[stateKey]).includes("version")) {
        state[stateKey] = modState;
        sendChat(COSH.name, `/w gm Type '${modCmd} config' to configure the script`);
      }

      const hasCOGCrew = typeof COGCrew === "object";
      writeLog(`API Mod hasCOGCrew${hasCOGCrew ? " " : " not "}detected`);
      state[stateKey].hasCOGCrew = hasCOGCrew;
      if (hasCOGCrew) state[stateKey].universe = "COG";

      const hasChatSetAttr = typeof ChatSetAttr === "object";
      writeLog(`API Mod ChatSetAttr${hasChatSetAttr ? " " : " not "}detected`);
      state[stateKey].hasChatSetAttr = hasChatSetAttr;

      const hasTokenMod = typeof TokenMod === "object";
      writeLog(`API Mod TokenMod${hasTokenMod ? " " : " not "}detected`);
      state[stateKey].hasTokenMod = hasTokenMod;

      if (state[stateKey].version !== modVersion) {
        migrateState();
      }

      helpHandout();

      writeLog(state[stateKey]);
    }

    /**
     * Return contrasted color
     * @param {string} hexColor 
     * @param {boolean} blackOrWhite 
     * @returns {string}
     */
    function invertColor(hexColor, blackOrWhite = false) {
      if (!hexColor) return;

      if (hexColor.indexOf('#') === 0) {
          hexColor = hexColor.slice(1);
      }
      // convert 3-digit hex to 6-digits
      if (hexColor.length === 3) {
          hexColor = hexColor[0] + hexColor[0] + hexColor[1] + hexColor[1] + hexColor[2] + hexColor[2];
      }
      if (hexColor.length !== 6) {
          log('Invalid HEX color');
          return "";
      }
      let r = parseInt(hexColor.slice(0, 2), 16),
          g = parseInt(hexColor.slice(2, 4), 16),
          b = parseInt(hexColor.slice(4, 6), 16);

      if (blackOrWhite) {
          // https://stackoverflow.com/a/3943023/112731
          return (r * 0.299 + g * 0.587 + b * 0.114) > 186
              ? '#000000'
              : '#FFFFFF';
      }
      // invert color components
      r = (255 - r).toString(16);
      g = (255 - g).toString(16);
      b = (255 - b).toString(16);
      // pad each with zeros and return
      return "#" + ("0" + r).slice(-2) + ("0" + g).slice(-2) + ("0" + b).slice(-2);
    }

    /**
     * Setup configuration for player
     * @param {object} msg Roll20 message object
     * @returns {void}
     */
    function playerSetup(msg) {
      const [ player ] = findObjs({
        _type: "player",
        _id: msg.playerid
      });
      if (player && player.color !== "transparent") {
        const backColor = player.get("color");
        const textColor = invertColor(backColor, true);
        buttonClasses.transparent.backgroundColor = backColor;
        buttonClasses.transparent.color = textColor;
        buttonClasses.flat.backgroundColor = backColor;
        buttonClasses.flat.color = textColor
      }

    }

    /**
     * Handle chat messages
     * @param {object} msg Roll20 chat message object
     * @returns {void}
     */
    function handleInput(msg) {

      const isGM = playerIsGM(msg.playerid);
      playerSetup(msg);

      // process API commands
      const message = msg.content.replace(/<br\/>/g, "");
      const [ command, option, ...args ] = message.split(/\s+/);
      if (msg.type !== "api" || command !== modCmd) return;
      
      if (option && option.split(":")[0] === "gm" && !isGM) {
        writeChat("You must be GM to run this command !");
        return;
      }

      const selectedTokens = getTokens(msg);
      const [ selectedToken ] = selectedTokens;
      const selectedCharacter = selectedToken ? getCharacterFromToken(selectedToken) : null;

      switch (option) {
        case "actions":
          const character = getCharacter(getCharacterId(args)) || selectedCharacter;
          if (character) {
            displayActions(character.id, args);
          } else {
            writeLog(
              `Cannot execute '${message}' : token not associated with a journal item`, 
              false
            );
            writeChat("\n\rPlease select a PC or NPC token first !");
          }
          break;
        case "config":
          configSetup(args, msg.playerid);
          break;
        case "debug":
          writeLog("=== TOKEN ===");
          writeLog(selectedToken);
          writeLog("=== CHARACTER ===");
          writeLog(selectedCharacter);
          selectedCharacter.get("_defaulttoken", blob => {
            writeLog("=== DEFAULT TOKEN ===");
            writeLog(blob);
          });
          writeChat("/w gm Token data dumped to console");
          break;
        case "gm:bars":
          if (!selectedToken || !selectedCharacter) break;
          const mook = args[0] && args[0].toLowerCase() === "--mook";
          gmLinkTokenBars(selectedToken, selectedCharacter, mook);
          break;
        case "gm:create":
          const newCharacter = gmCreateSheet(args);
          if (newCharacter && selectedToken) {
            gmLinkToken(newCharacter, selectedToken);
          }
          break;                  
        case "gm:sheet":
          if (selectedCharacter) gmSheet(selectedCharacter);
          break;
        case "gm:layer":
          if (selectedTokens.length > 0) gmToggleLayer(selectedTokens);
          break;
        case "stats":
          rollStats(args);
          break;
        case "token":
          if (!selectedToken || !selectedCharacter) break;
          tokenMarkers(selectedToken, selectedCharacter, args);
          break;
        default:
          displayHelp(args[0]);
          break;
      }
    }

    /**
     * Send ready message to chat
     * @returns {void}
     */
    function readyMessage() {

      let html = htmlHelper.getElement("strong", "READY");
      html = htmlHelper.getElement("span", html, {
        style: htmlHelper.getStyle({
          backgroundColor: "green",
          color: "white",
          padding: "5px",
          borderRadius: "5px",
        }),
      });
      writeChat("/w gm " + html);

    }

    /**
     * Register event handlers 
     * - for chat message
     * @returns {void}
     */
    function registerEventHandlers() {

      /**
       * Wire-up event for API chat message
       */
      on("chat:message", handleInput);

      readyMessage();
    }

    return {
      name: modName,
      version: modVersion,
      checkInstall,
      registerEventHandlers,
    };
  })();

/**
 * Wire-up initialization event
 */
on("ready", function () {
  "use strict";

  COSH.checkInstall();

  COSH.registerEventHandlers();

  log(`${COSH.name} version ${COSH.version} loaded`);
});
