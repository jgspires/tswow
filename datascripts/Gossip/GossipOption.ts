/*
 * This file is part of tswow (https://github.com/tswow)
 *
 * Copyright (C) 2020 tswow <https://github.com/tswow/>
 * This program is free software: you can redistribute it and/or
 * modify it under the terms of the GNU General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */
import { SQL } from "wotlkdata";
import { CellSystem } from "wotlkdata/cell/systems/CellSystem";
import { gossip_menu_optionRow } from "wotlkdata/sql/types/gossip_menu_option";
import { Ids } from "../Misc/Ids";
import { BroadcastText } from "../BroadcastText/BroadcastText";
import { Condition } from "../Conditions/Condition";
import { Gossip } from "./Gossip";
import { GossipIconCell } from "./GossipIcon";
import { GossipOptionType as GossipOptionAction } from "./GossipOptionType";
import { Vendor } from "../Vendor/Vendor";

export class GossipOption extends CellSystem<Gossip> {
    readonly Condition: Condition<this>;
    readonly row: gossip_menu_optionRow;
    protected _label: string = "";

    constructor(owner: Gossip, row: gossip_menu_optionRow) {
        super(owner);
        this.row = row;
        this.Condition = new Condition(this, 15, this.end.ID,this.row.OptionID.get(),0);
    }

    get Icon(){return new GossipIconCell(this, this.row.OptionIcon); }
    get Action(){return new GossipOptionAction(this); }
    get POI() { return this.wrap(this.row.ActionPoiID); }
    get MenuID() { return this.wrap(this.row.ActionMenuID); }

    get Text(){
        const id = this.row.OptionBroadcastTextID;
        if(id.get()>0) {
            return new BroadcastText(this,
                SQL.broadcast_text.find({ID:id.get()}));
        } else {
            id.set(Ids.BroadcastText.id());
            return new BroadcastText(this,
                SQL.broadcast_text.add(id.get()))
        }
    }
}

export class GossipOptions extends CellSystem<Gossip> {
    get length() {
        return SQL.gossip_menu_option
            .filter({MenuID:this.owner.ID}).length;
    }

    getIndex(index: number, callback: (option: GossipOption)=>void) {
        callback(new GossipOption(this.owner, SQL.gossip_menu_option
            .find({MenuID: this.owner.ID, OptionID: index})));
        return this.owner;
    }

    forEach(callback: (option: GossipOption)=>any) {
        SQL.gossip_menu_option.filter({MenuID: this.owner.ID})
            .forEach(x=>callback(new GossipOption(this.owner, x)));
        return this.owner;
    }

    add(callback: (option: GossipOption)=>void) {
        callback(new GossipOption(this.owner, 
            SQL.gossip_menu_option.add(this.owner.ID, this.length)
                .OptionType.set(1)
                .OptionNpcFlag.set(1)
                .VerifiedBuild.set(17688)
            ));
        return this.owner;
    }

    addVendor(creatureId: number, callback: (vendor: Vendor<void>)=>void) {
        this.add((option)=>{
            option.Action
        });
    }
}