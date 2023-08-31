/**
 * COSheetHelper : COC & COG sheets helper functions
 * Version : 1.0.0
 * Last updated : 2023-08-14
 * Usage :
 * !cosh <function> <arguments>
 * See documentation @ https://stephaned68.github.io/COCGSheetHelper/commands
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
    const modVersion = "1.1.0";
    const modCmd = "!cosh";
    const modHelpHandout = "Mod-COSheet-Help";

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
    function sendLog(msg, force = true) {
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
     * Return a date-time ISO string
     * @returns string
     */
    function dateTimeStamp() {
      const dt = new Date(Date.now()).toISOString();
      return dt.split("T")[0] + " @ " + dt.split("T")[1].split(".")[0];
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

    const ROLLS = [ "jet_for", "jet_dex", "jet_con", "jet_int", "jet_per", "jet_cha" ];

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
      if (isNaN(index)) return `repeating_${section}_${index}_${attr}`;
      else return `repeating_${section}_$${index}_${attr}`;
    }

    /**
     * Return the chat string for character's repeating attribute
     * @param {string} char
     * @param {string} section
     * @param {number|string} index
     * @param {string} attr
     * @returns {string} chat string
     */
    function charRepeatAttr(char, section, index, attr) {
      return charAttr(char, repeatAttr(section, index, attr));
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
     * Return the ordered list of ids for a section
     * @param {string} sectionName : section name
     * @param {function} callback : callback function to process the ids
     */
    function getSectionIDsOrdered(sectionName, callback) {
      "use strict";
      getAttrs([`_reporder_${sectionName}`], function (v) {
        getSectionIDs(sectionName, function (idArray) {
          let reporderArray = v[`_reporder_${sectionName}`]
              ? v[`_reporder_${sectionName}`].toLowerCase().split(",")
              : [],
            ids = [
              ...new Set(
                reporderArray.filter((x) => idArray.includes(x)).concat(idArray)
              ),
            ];
          callback(ids);
        });
      });
    }

    /**
     * Return an handout object
     * @param {string} name : handout name
     * @returns {object} handout object
     */
    function findHandout(name) {
      const [ handoutObj ] = findObjs(
        {
          _type: "handout",
          _name: name,
        },
        {
          caseInsensitive: true,
        }
      );
      return handoutObj;
    }

    /**
     * Return an handout hyperlink
     * @param {string} name
     * @param {string} sequence
     * @param {object} handoutObj
     * @returns {string} handout url
     */
    function handoutLink(name, sequence, handoutObj) {
      let link = "";
      if (!handoutObj) handoutObj = findHandout(name);
      if (handoutObj) {
        if (sequence > 0) link = sequence.toString() + ". ";
        link = `[${link}${name}](http://journal.roll20.net/handout/${handoutObj.id})`;
      }
      return link;
    }

    /**
     * Return an ability object
     * @param {string} charId
     * @param {string} abilityName
     * @returns {object} ability object
     */
    function findAbility(charId, abilityName) {
      const [ abilityObj ] = findObjs(
        {
          _type: "ability",
          _characterid: charId,
          name: abilityName,
        },
        {
          caseInsensitive: true,
        }
      );
      return abilityObj;
    }

    /**
     * Return an object with 2 properties :
     * - {string} roll:   the fully qualified name of a roll for an ability identifier (VxRy)
     * - {string} button: the text to display on the roll button
     * @param {string} charId
     * @param {string} abilityId
     * @returns {object} abilityRollObj
     */
    function findAbilityRoll(charId, abilityId) {
      const rowIds = repeatRowIds(charId, "jetcapas");
      let abilityRollObj = {
        roll: abilityId.toLowerCase(),
        button: "💬",
      };
      for (const rowId of rowIds) {
        const roll = findObjs({
          _type: "attribute",
          _characterid: charId,
          name: `repeating_jetcapas_${rowId}_jetcapavr`,
        });
        if (roll.length === 1) {
          if (roll[0].get("current") === abilityId.toLowerCase()) {
            abilityRollObj = {
              roll: `repeating_jetcapas_${rowId}_pjcapa`,
              button: "🎲",
            };
            break;
          }
        }
      }
      return abilityRollObj;
    }

    /**
     * Return the text for an ability chat button
     * @param {object} params
     * @param {string} params.charId
     * @param {string} params.name
     * @param {string} params.ability
     * @param {number} params.sequence
     * @param {object} params.handoutObj
     * @param {object} params.abilityObj
     * @returns {string} text for ability chat button
     */
    function abilityButton(params) {
      let button = "";
      let buttonRoll = "";
      let abilityRoll = {};
      let handoutObj = params.handoutObj;
      if (!handoutObj) handoutObj = findHandout(params.name);
      let abilityObj = params.abilityObj;
      if (!abilityObj) abilityObj = findAbility(params.charId, params.ability);
      if (abilityObj) {
        if (abilityObj.get("action") != "") {
          buttonRoll = params.ability;
        }
      } else {
        abilityRoll = findAbilityRoll(params.charId, params.ability);
        if (abilityRoll) {
          buttonRoll = abilityRoll.roll;
        }
      }
      if (buttonRoll !== "") {
        button += "[";
        if (handoutObj) {
          button += abilityRoll.button === undefined ? "🎲" : abilityRoll.button;
        } else {
          if (params.sequence > 0) button += params.sequence.toString() + ". ";
          button += params.name;
        }
        button += `](~${params.charId}|${buttonRoll}" ${buttonStyle("flat")})`;
      }
      return button;
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
     * Return selected tokens as an array of character objects
     * @param {object} msg Chat message object
     * @returns {object[]} character objects for selected tokens
     */
    function getCharactersFromTokens(msg) {
      let characters = [];
      const tokens = getTokens(msg);
      tokens.forEach((token) => {
        const character = getCharacterFromToken(token);
        if (character) {
          characters.push(character);
        }
      });
      return characters;
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

    /**
     * Output a list of actions to the chat
     * @param {string} charId Character Id
     * @param {string} args Chat command arguments
     */
    function displayActions(charId, args) {
      const charName = getAttrByName(charId, "character_name");
      let chatMsg = "";
      let optDesc = ""; // descriptions only
      const fiche = getAttrByName(charId, "type_personnage");
      for (const arg of args) {
        if (arg == "--desc") optDesc = " --desc";
      }

      const attrNames = {
        COC: {
          pj: {
            togm: "togm",
            atkRpt: "armes",
            atkName: "armenom",
            atkRoll: "pjatk",
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
            capaRpt: "jetcapas",
            capaName: "jetcapanom",
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
          vaisseau: {
            togm: "togm",
            atkRpt: "armesv",
            atkName: "armenom",
            atkRoll: "vatk",
          },
        },
      };

      const attrs = attrNames[state[stateKey].universe][fiche];
      const toGM = getAttrByName(charId, attrNames[state[stateKey].universe][fiche].togm);

      let rowIds = [];
      switch (args[0]) {
        // !cosh actions --voies : liste des voies
        case "--voies":
          const voies = [
            "voie1nom",
            "voie2nom",
            "voie3nom",
            "voie4nom",
            "voie5nom",
            "voie6nom",
            "voie7nom",
            "voie8nom",
            "voie9nom",
          ];
          voies.forEach((voieAttr, voie) => {
            const voieNom = getAttrByName(charId, voieAttr);
            if (voieNom != "") {
              chatMsg += `[${voie + 1}. ${voieNom}](!cosh actions --voie ${
                voie + 1
              }${optDesc} --charId=${charId}" ${buttonStyle("flat")})\n\r`;
            }
          });
          if (chatMsg != "") {
            chatMsg =
              whisper(toGM, charName) +
              `&{template:co1} {{perso=${charAttr(
                charName,
                "character_name"
              )}}} {{subtags=${charAttr(
                charName,
                "PROFIL"
              )}}} {{name=Capacités}} {{desc=${chatMsg} }}`;
          }
          break;

        // !cosh actions --voie # : liste des capacités voie #
        case "--voie":
          const pathId = args[1];
          const voie = `voie${pathId}-`;
          const rangs = [
            voie + "1",
            voie + "2",
            voie + "3",
            voie + "4",
            voie + "5",
          ];
          rangs.forEach((rangAttr, rang) => {
            const vnRnId = rangAttr.replace("voie", "v").replace("-", "r");
            // check if character has ability
            const hasAbility = getAttrByName(
              charId,
              vnRnId
            );
            if (hasAbility !== "1") return;
            // get ability title
            const vnRnTtl = rangAttr.replace("-", "-t");
            const rangTitle = getAttrByName(
              charId,
              vnRnTtl
            );
            let rangInfo = "";
            // parse from description if no title found
            if (rangTitle !== "") {
              rangInfo = rangTitle;
            } else {
              rangInfo = getAttrByName(charId, rangAttr);
              if (rangInfo.indexOf("\n") !== -1)
                rangInfo = rangInfo.split("\n")[0];
            }
            // can have multiple ';' separated abilities
            const rangData = rangInfo.split(";");
            let chatRang = "";
            rangData.forEach((rangNom, item) => {
              if (chatRang != "" && item > 0) chatRang += ", ";
              rangNom = rangNom.trim();
              let rangLabel = rangNom;
              // can have <ability name> | <display label>
              if (rangNom.indexOf("|") != -1) {
                const rangExtras = rangNom.split("|");
                rangNom = rangExtras[0].trim();
                rangLabel = rangExtras[1].trim();
              }
              const abilityName = `V${pathId}R${ (rang + 1).toString() }`;
              if (rangNom != "") {
                const handoutObj = findHandout(rangNom);
                if (handoutObj) {
                  chatRang +=
                    handoutLink(
                      rangLabel,
                      item > 0 ? 0 : rang + 1,
                      handoutObj
                    ) + " ";
                }
                if (optDesc != " --desc") {
                  const abilityObj = findAbility(charId, abilityName);
                  if (abilityObj) {
                    chatRang += abilityButton({
                      charId,
                      name: rangLabel,
                      ability: abilityName,
                      sequence: rang + 1,
                      handoutObj,
                      abilityObj,
                    });
                  } else {
                    chatRang += abilityButton({
                      charId,
                      name: rangLabel,
                      ability: abilityName,
                      sequence: rang + 1,
                      handoutObj,
                      abilityObj: null,
                    });
                  }
                }
              }
            });
            if (chatRang != "") chatMsg += chatRang + "\n\r";
          });
          if (chatMsg != "") {
            chatMsg =
              whisper(toGM, charName) +
              `&{template:co1} {{perso=${charName}}} {{subtags=Capacités}} {{name=${charAttr(
                charName,
                `voie${pathId}nom`
              )}}} {{desc=${chatMsg} }}`;
          }
          break;

        // !cosh actions --competences
        case "--competences":
          if (attrs.capaRpt === "") break;
          rowIds = repeatRowIds(charId, attrs.capaRpt);
          if (rowIds.length > 0) {
            rowIds.forEach((rowId) => {
              const compNom = getAttrByName(
                charId,
                repeatAttr(attrs.capaRpt, rowId, attrs.capaName)
              );
              const compLabel = getAttrByName(
                charId,
                repeatAttr(attrs.capaRpt, rowId, attrs.capaSkill)
              );
              if (compNom != "") {
                chatMsg +=
                  `[${compNom}](~${charId}|${repeatAttr(
                    attrs.capaRpt,
                    rowId,
                    attrs.capaRoll
                  )})` +
                  (compLabel && compLabel != null ? ` ${compLabel}` : "") +
                  "\n\r";
              }
            });
            if (chatMsg != "") {
              chatMsg =
                whisper(toGM, charName) +
                `&{template:co1} {{perso=${charName}}} {{subtags=${charAttr(
                  charName,
                  "PROFIL"
                )}}} {{name=Compétences}} {{desc=${chatMsg} }}`;
            }
          }
          break;

        // !cosh actions --caracs
        case "--caracs":
          const msgItems = [];
          ROLLS.forEach((roll) => {
            msgItems.push(`[${carac}](~${charId}|${roll}" ${buttonStyle("flat")})`);
          });
          chatMsg = msgItems.join(" | ");
          chatMsg =
            whisper(toGM, charName) +
            `&{template:co1} {{perso=${charName}}} {{subtag=Tests}} {{name=Caractéristiques}} {{desc=${chatMsg} }}`;
          break;

        // !cosh actions --attaques
        case "--attaques":
          if (attrs.atkRpt === "") break;
          rowIds = repeatRowIds(charId, attrs.atkRpt);
          if (rowIds.length > 0) {
            for (let arme = 0; arme < rowIds.length; arme++) {
              let armeNom = "";
              armeNom = getAttrByName(
                charId,
                repeatAttr(attrs.atkRpt, rowIds[arme], attrs.atkName)
              );
              let atkNom = "";
              if (fiche === "pj" || fiche === "vaisseau") {
                atkNom = getAttrByName(
                  charId,
                  repeatAttr(attrs.atkRpt, rowIds[arme], "armejetn")
                );
              }
              let atkInfo = "";
              atkInfo += atkNom !== "" ? " " + atkNom : "";
              const atkType = getAttrByName(
                charId,
                repeatAttr(attrs.atkRpt, rowIds[arme], "armeatk")
              );
              if (fiche !== "vaisseau") {                
                let limitee = "";
                if (fiche !== "pnj")
                  limitee = getAttrByName(
                    charId,
                    repeatAttr(attrs.atkRpt, rowIds[arme], "armelim")
                  );
                if (limitee != "") atkInfo += " " + limitee;
                let portee = "";
                if (fiche !== "pnj")
                  portee = getAttrByName(
                    charId,
                    repeatAttr(attrs.atkRpt, rowIds[arme], "armeportee")
                  );
                if (portee != "") {
                  if (atkType == "@{ATKTIR}") atkInfo += " (D:";
                  if (atkType == "@{ATKMAG}") atkInfo += " (Mag:";
                  if (atkType == "@{ATKMEN}") atkInfo += " (Men:";
                  if (
                    atkType == "@{ATKPSYINFLU}" ||
                    atkType == "@{ATKPSYINTUI}"
                  )
                    atkInfo += " (Psy:";
                  atkInfo += portee + ")";
                } else {
                  if (fiche !== "pnj") {
                    if (atkType == "@{ATKMAG}") {
                      atkInfo += " (Mag)";
                    } else if (atkType == "@{ATKMEN}") {
                      atkInfo += " (Men)";
                    } else if (
                      atkType == "@{ATKPSYINFLU}" ||
                      atkType == "@{ATKPSYINTUI}"
                    ) {
                      atkInfo += " (Psy)";
                    } else {
                      atkInfo += " (C)";
                    }
                  }
                }
              }
              if (armeNom != "") {
                chatMsg += `[${armeNom}](~${charId}|${repeatAttr(
                  attrs.atkRpt,
                  rowIds[arme],
                  attrs.atkRoll
                )}" ${buttonStyle("flat")}) ${atkInfo}\n\r`;
              }
            }
            if (chatMsg != "") {
              chatMsg =
                whisper(toGM, charName) +
                `&{template:co1} {{perso=${charName}}} {{subtags=Combat}} {{name=Attaques}} {{desc=${chatMsg} }}`;
            }
          }
          break;

        case "--atk":
          if (attrs.atkRpt === "" || args.length < 2) break;
          chatMsg =
            whisper(toGM, charName) +
            `%{${charName}|${repeatAttr(
              attrs.atkRpt,
              args[1],
              attrs.atkRoll
            )}}`;
          break;

        default:
          break;
      }
      if (chatMsg != "") {
        sendLog(chatMsg);
        sendChat(`character|${charId}`, chatMsg);
      }
    }

    /**
     * Find an handout object or create it
     * @param {object} props Properties of the object to find or create
     * @param {string} unique Unique identifier for the handout
     * @returns Handout object
     */
    function findOrNewHandout(props, unique) {
      unique = unique || "";
      const exist = findObjs({
        _type: "handout",
        name: props.name,
      });
      let handoutObj;
      if (exist.length === 0) {
        handoutObj = createObj("handout", props);
      } else {
        if (exist.length === 1 || unique === "") {
          handoutObj = exist[0];
        } else {
          exist.forEach((handout) => {
            handout.get("gmnotes", function (gmnotes) {
              if (gmnotes === unique) {
                handoutObj = handout;
              }
            });
          });
        }
      }
      return handoutObj;
    }

    /**
     * Find one or more attribute object(s)
     * @param {object} props Properties of the attribute to find
     * @returns {object[]}
     */
    function findAttribute(props) {
      const criteria = { _type: "attribute" };
      for (prop in props) {
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
     * Find an attribute object or create it
     * @param {object} props Properties of the attribute to find or create
     */
    function findOrNewAttribute(props) {
      const exist = findAttribute(props);
      let attributeObj;
      if (exist.length === 0) {
        attributeObj = createObj("attribute", props);
      } else {
        attributeObj = exist[0];
      }
      return attributeObj;
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

      sendChat(modName,"/w gm " + html);
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
      sendChat(modName, chatMsg);
    }

    /**
     * Display script configuration
     */
    function configDisplay() {
      let helpMsg = `/w gm &{template:default} {{name=${modName} v${modVersion} Config}}`;
      const univ = state[stateKey].universe;
      helpMsg += `{{Univers=*${univ}* `;
      if (univ === "COC") {
        helpMsg += "[COG](!cosh config --universe COG)";
      } else {
        helpMsg += "[COC](!cosh config --universe COC)";
      }
      helpMsg += `}} {{Msg privés=*${state[stateKey].whisper}* [Toggle](!cosh config --whisper)}}`;
      helpMsg += `{{Logging=*${state[stateKey].logging}* [Toggle](!cosh config --log)}}`;
      sendChat(modName, helpMsg);
    }

    /**
     * Process configuration command
     * !cosh config [...]
     * @param {string[]} args Chat command arguments
     */
    function configSetup(args) {
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
        default:
          break;
      }
      configDisplay();
    }

    /**
     * Check only one token is selected
     * @param {object} msg Roll20 chat message object
     * @param {object[]} tokens List of selected Roll20 token objects
     * @returns Selected Roll20 token object or null if 0 or more than 1 token selected
     */
    function singleToken(msg, tokens) {
      const count = tokens.length;
      if (count != 1) {
        sendChat(modName, "\n\rPlease select a single token first !");
        sendLog(`Cannot execute '${msg.content}' : ${count} token(s) selected`);
        return null;
      }
      return tokens[0];
    }

    /**
     * Display script help
     */
    function displayHelp() {
      let helpMsg = `/w gm &{template:default} {{name=${modName} v${modVersion} Commands Help }}`;
      [
        {
          command: "!cosh",
          description: "followed by..." 
        },
        {
          command: "actions",
          description: "To display PC/NPC actions menus in chat",
        },
        {
          command: "config",
          description: "To configure the script"
        },
        {
          command: "debug",
          description: "To send token object data to API console",
        },
        {
          command: "gmsheet",
          description: "To display a summary stat-block in the chat",
        },
        {
          command: "token",
          description: "To set/unset token markers"
        },
        {
          command: "stats",
          description: "To roll PC stats"
        },
      ].forEach((help) => {
        helpMsg += `{{${help.command}=${help.description} }}`;
      });
      sendChat(modName, helpMsg);
    }

    /**
     * Process API chat commands
     * @param {object} msg Roll20 chat message object
     *
     * !cosh action <...args...>
     */
    function processCmd(msg) {
      // parse chat message
      // cmd : command entered
      // args[] : list of arguments
      msg.content = msg.content.replace(/\s+/g, " "); //remove duplicate whites
      const [ cmd, action, ...args ] = msg.content.split(" ");
      const tokens = getTokens(msg);
      let character = null;
      let token = null;

      switch (action) {
        case "debug":
          sendLog(msg.content);
          sendLog(singleToken(msg, tokens));
          sendChat(modName, "/w gm Token data dumped to console");
          break;
        case "config":
          configSetup(args);
          break;
        case "actions":
          character = getCharacter(getCharacterId(args));
          // check if token selected
          if (!character) {
            token = singleToken(msg, tokens);
            if (!token) {
              break;
            }
            character = getCharacterFromToken(token);
          }
          // display character's action
          if (character) {
            displayActions(character.id, args);
          } else {
            sendChat(modName, "\n\rPlease select a PC or NPC token first !");
            sendLog(
              `Cannot execute '${msg.content}' : token not associated with a journal item`, 
              false
            );
          }
          break;
          case "gmsheet":
            token = singleToken(msg, tokens);
            if (!token) {
              break;
            }
            character = getCharacterFromToken(token);
            gmSheet(character);
            break;
        case "token":
          token = singleToken(msg, tokens);
          if (!token) {
            break;
          }
          character = getCharacterFromToken(token);
          tokenMarkers(token, character, args);
          break;
        case "stats":
          rollStats(args);
          break;
        default:
          displayHelp();
          break;
      }
      return;
    }

    function migrateState() {
      state[stateKey].version = modVersion;
    }

    function helpHandout() {
      let [ helpHandout ] = findObjs({
        _type:	"handout",
        name: modHelpHandout
      });
      if (helpHandout === undefined) {
        helpHandout = createObj("handout", {
          name: modHelpHandout,
        });
      }
      if (helpHandout && helpHandout.get("gmnotes") === modVersion) return;
      if (helpHandout) {
        helpHandout.set("notes", `
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
        <code>!cosh gmsheet</code>
        <p>Affiche un "stat-block" synthétique des attributs du personnage.</p>
        <code>!cosh token --set:+xxx,+yyyy,-zzzz</code>
        <ul>
          <li>Active les marqueurs de jeton préfixés par + </li>
          <li>Désactive les marqueurs de jeton préfixés par - </li>
        </ul>
        <p>Chaque marqueur peut être suffixé par =n (où 1 &le; n &le; 9) pour ajouter un badge numérique au marqueur</p>
        <code>!cosh stats</code>
        <p>Affiche un tirage de caractéristiques dans le chat.</p>
        `);
        helpHandout.set("gmnotes", modVersion);
      }
    }

    function checkInstall() {
      if (!state[stateKey] || !Object.keys(state[stateKey]).includes("version")) {
        state[stateKey] = {
          version: modVersion,
          universe: "COC",
          whisper: false,
          logging: false,
          hasCOGCrew: false,
          hasChatSetAttr: false,
          hasTokenMod: false,
        };
        sendChat(COSH.name, `/w gm Type '${modCmd} config' to configure the script`);
      }

      const hasCOGCrew = typeof COGCrew === "object";
      sendLog(`API Mod hasCOGCrew${hasCOGCrew ? " " : " not "}detected`);
      state[stateKey].hasCOGCrew = hasCOGCrew;
      if (hasCOGCrew) state[stateKey].universe = "COG";

      const hasChatSetAttr = typeof ChatSetAttr === "object";
      sendLog(`API Mod ChatSetAttr${hasChatSetAttr ? " " : " not "}detected`);
      state[stateKey].hasChatSetAttr = hasChatSetAttr;

      const hasTokenMod = typeof TokenMod === "object";
      sendLog(`API Mod TokenMod${hasTokenMod ? " " : " not "}detected`);
      state[stateKey].hasTokenMod = hasTokenMod;

      if (state[stateKey].version !== modVersion) {
        migrateState();
      }

      helpHandout();

      sendLog(state[stateKey]);
    }

    /**
     * Setup configuration for player
     * @param {object} msg Roll20 message object
     */
    function playerSetup(msg) {
            
      // get player color
      const [ player ] = findObjs({
        _type: "player",
        _id: msg.playerid
      });
      if (player && player.color !== "transparent") {
        const backColor = player.get("color");
        buttonClasses.transparent.backgroundColor = backColor;
        buttonClasses.flat.backgroundColor = backColor;
      }

    }

    /**
     * Handle chat messages
     * @param {object} msg Roll20 chat message object
     */
    function handleInput(msg) {

      playerSetup(msg);

      // process API commands
      const [ cmd ] = msg.content.replace(/<br\/>/g, "").split(/\s+/);
      if (msg.type === "api" && cmd.indexOf(modCmd) === 0) {
        processCmd(msg);
      }

    }

    /**
     * Send ready message to chat
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
      sendChat(modName, "/w gm " + html);

    }

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
