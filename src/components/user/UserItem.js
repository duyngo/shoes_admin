import React,{ Component } from 'react';

import Tags from '../uielements/tag';
import TagWrapper from '../../containers/Tags/tag.style';
import UserHelper from '../../helpers/user';

const Tag = props => (
    <TagWrapper>
      <Tags {...props}>{props.children}</Tags>
    </TagWrapper>
);


export class UserItem extends Component {

    displayUserDetails = () => {
        this.props.displayUserDetails(this.props.user)
    }

    render(){
        
        const {
            user
        } = this.props;

        const { tagColor, tagText } = UserHelper.renderUserType(user.type);

        return (
            <div className="user-item">
                <div className="user-item-body" onClick={this.displayUserDetails}>
                    { user && <span className="user-item-name">{ user.fullName }</span> }
                    { user && <span className="user-item-category"><Tag color={tagColor}>{tagText}</Tag></span> }
                </div>
            </div>
        )

    }
}

export default UserItem;